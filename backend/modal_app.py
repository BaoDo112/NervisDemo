import modal
from fastapi.responses import JSONResponse

# Define the image with dependencies
image = (
    modal.Image.debian_slim()
    .apt_install("git")
    .pip_install(
        "torch",
        "torchvision",
        "transformers",
        "accelerate",
        "bitsandbytes",
        "peft",
        "sentence-transformers",
        "faster-whisper",
        "fastapi",
        "uvicorn"
    )
    # Install Unsloth (requires specific steps, simplifying for now to compatible versions)
    # In production, use the official Unsloth docker image or install script
    .pip_install("unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git")
)

def download_model():
    from unsloth import FastLanguageModel
    import torch
    # Unsloth requires GPU check to pass, even for download sometimes if it initializes cuda
    FastLanguageModel.from_pretrained(
        model_name="unsloth/gemma-3-4b-it-bnb-4bit",
        max_seq_length=2048,
        dtype=None,
        load_in_4bit=True,
    )

# Request GPU for the build step so Unsloth can initialize
image = image.run_function(download_model, gpu="T4")

app = modal.App("ai-interview-backend", image=image)

# 1. LLM Function (Gemma 3 4b via Unsloth)
@app.cls(gpu="T4", scaledown_window=300)
class LLMEngine:
    def __enter__(self):
        from unsloth import FastLanguageModel
        import torch
        
        # Load model in 4-bit (will use cached weights from image)
        self.model, self.tokenizer = FastLanguageModel.from_pretrained(
            model_name = "unsloth/gemma-3-4b-it-bnb-4bit", 
            max_seq_length = 2048,
            dtype = None,
            load_in_4bit = True,
        )
        FastLanguageModel.for_inference(self.model)
        self.device = "cuda" if torch.cuda.is_available() else "cpu"

    @modal.method()
    def generate(self, messages: list):
        try:
            tok = self.tokenizer
            if hasattr(tok, "apply_chat_template"):
                prompt = tok.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
            else:
                prompt = "\n".join([f"{str(m.get('role'))}: {str(m.get('content'))}" for m in messages]) + "\nassistant:"

            inputs = tok([prompt], return_tensors="pt")
            if self.device == "cuda":
                inputs = inputs.to("cuda")

            outputs = self.model.generate(
                **inputs,
                max_new_tokens=256,
                do_sample=True,
                temperature=0.7,
                top_p=0.9,
                repetition_penalty=1.1,
                use_cache=True,
            )
            generated_ids = outputs[0][inputs.input_ids.shape[1]:]
            text = tok.decode(generated_ids, skip_special_tokens=True).strip()
            if text:
                return text
            outputs = self.model.generate(
                **inputs,
                max_new_tokens=256,
                do_sample=True,
                temperature=0.9,
                top_p=0.95,
                use_cache=True,
            )
            generated_ids = outputs[0][inputs.input_ids.shape[1]:]
            text = tok.decode(generated_ids, skip_special_tokens=True).strip()
            if text:
                return text
            user_msgs = [m for m in messages if isinstance(m, dict) and m.get('role') == 'user']
            last = user_msgs[-1]['content'] if user_msgs else ''
            return f"Phản hồi sơ bộ cho '{last}': vui lòng mô tả mục tiêu, khó khăn và một ví dụ cụ thể để tôi đặt câu hỏi tiếp theo."
        except Exception:
            user_msgs = [m for m in messages if isinstance(m, dict) and m.get('role') == 'user']
            last = user_msgs[-1]['content'] if user_msgs else ''
            return f"Phản hồi sơ bộ cho '{last}': vui lòng mô tả mục tiêu, khó khăn và một ví dụ cụ thể để tôi đặt câu hỏi tiếp theo."

# 2. STT Function (Faster-Whisper)
@app.cls(gpu="T4", scaledown_window=300)
class STTEngine:
    def __enter__(self):
        from faster_whisper import WhisperModel
        try:
            self.model = WhisperModel("large-v3", device="cuda", compute_type="float16")
        except Exception:
            # Fallback to CPU if GPU unavailable
            self.model = WhisperModel("large-v3", device="cpu", compute_type="int8")

    @modal.method()
    def transcribe(self, audio_data: bytes):
        import tempfile
        import os
        # Ensure model is available even if __enter__ wasn't invoked
        if not hasattr(self, "model") or self.model is None:
            from faster_whisper import WhisperModel
            try:
                self.model = WhisperModel("large-v3", device="cuda", compute_type="float16")
            except Exception:
                self.model = WhisperModel("large-v3", device="cpu", compute_type="int8")
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as fp:
            fp.write(audio_data)
            fp.close()
            segments, info = self.model.transcribe(fp.name, language="vi")
            text = " ".join([s.text for s in segments])
            os.unlink(fp.name)
            return text

# 3. Embedding Function (Sentence-Transformers)
@app.cls(cpu=2)
class EmbeddingEngine:
    def __enter__(self):
        from sentence_transformers import SentenceTransformer
        self.model = SentenceTransformer('nomic-ai/nomic-embed-text-v1.5', trust_remote_code=True)

    @modal.method()
    def embed(self, text: str):
        return self.model.encode(text).tolist()

# 4. Web Endpoint (FastAPI)
def _cors(data: dict):
    return JSONResponse(
        content=data,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
        },
    )

@app.function()
@modal.fastapi_endpoint(method="OPTIONS")
def api_options(_: dict):
    return _cors({"ok": True})

@app.function()
@modal.fastapi_endpoint(method="POST")
def api_entrypoint(item: dict):
    try:
        # Simple router
        action = item.get("action")
        payload = item.get("payload")

        if action == "chat":
            llm = LLMEngine()
            try:
                result = llm.generate.remote(payload)
                return _cors({"response": result})
            except Exception:
                # Fallback reply
                try:
                    user_msgs = [m for m in payload if isinstance(m, dict) and m.get('role') == 'user']
                    last = user_msgs[-1]['content'] if user_msgs else ''
                except Exception:
                    last = ''
                fallback = f"Tôi đã nhận: '{last}'. Bạn hãy nêu mục tiêu và ví dụ cụ thể để tôi đặt câu hỏi tiếp theo."
                return _cors({"response": fallback})

        elif action == "transcribe":
            # Payload should be base64 encoded audio
            import base64
            audio_bytes = base64.b64decode(payload)
            stt = STTEngine()
            try:
                text = stt.transcribe.remote(audio_bytes)
                return _cors({"text": text})
            except Exception:
                return _cors({"text": ""})

        elif action == "embed":
            embedder = EmbeddingEngine()
            vector = embedder.embed.remote(payload)
            return _cors({"vector": vector})

        return _cors({"error": "Invalid action"})
    except Exception as e:
        return _cors({"error": f"server_error: {str(e)}"})
