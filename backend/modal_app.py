import modal

# Define the image with dependencies
image = (
    modal.Image.debian_slim()
    .apt_install("git")
    .pip_install(
        "torch",
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
    FastLanguageModel.from_pretrained(
        model_name="unsloth/gemma-3-4b-it-bnb-4bit",
        max_seq_length=2048,
        dtype=None,
        load_in_4bit=True,
    )

image = image.run_function(download_model)

app = modal.App("ai-interview-backend", image=image)

# 1. LLM Function (Gemma 3 4b via Unsloth)
@app.cls(gpu="T4", container_idle_timeout=300)
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

    @modal.method()
    def generate(self, messages: list):
        # Apply chat template
        prompt = self.tokenizer.apply_chat_template(
            messages,
            tokenize = False,
            add_generation_prompt = True
        )
        inputs = self.tokenizer([prompt], return_tensors = "pt").to("cuda")
        outputs = self.model.generate(**inputs, max_new_tokens = 1024, use_cache = True)
        # Decode only the new tokens
        generated_ids = outputs[0][inputs.input_ids.shape[1]:]
        return self.tokenizer.decode(generated_ids, skip_special_tokens=True)

# 2. STT Function (Faster-Whisper)
@app.cls(gpu="T4", container_idle_timeout=300)
class STTEngine:
    def __enter__(self):
        from faster_whisper import WhisperModel
        self.model = WhisperModel("large-v3", device="cuda", compute_type="float16")

    @modal.method()
    def transcribe(self, audio_data: bytes):
        import tempfile
        import os
        
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
@app.function()
@modal.web_endpoint(method="POST")
def api_entrypoint(item: dict):
    # Simple router
    action = item.get("action")
    payload = item.get("payload")
    
    if action == "chat":
        llm = LLMEngine()
        return {"response": llm.generate.remote(payload)}
    
    elif action == "transcribe":
        # Payload should be base64 encoded audio
        import base64
        audio_bytes = base64.b64decode(payload)
        stt = STTEngine()
        return {"text": stt.transcribe.remote(audio_bytes)}
        
    elif action == "embed":
        embedder = EmbeddingEngine()
        return {"vector": embedder.embed.remote(payload)}
    
    return {"error": "Invalid action"}
