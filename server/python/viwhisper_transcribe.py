import argparse
import json
import os
import sys
import time

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--model_dir', type=str, default='medium')
    parser.add_argument('--device', type=str, default='cpu')
    args = parser.parse_args()

    try:
        from faster_whisper import WhisperModel
    except ImportError:
        print(json.dumps({"success": False, "error": "faster_whisper import failed"}))
        sys.stdout.flush()
        return

    # Load model once
    model = None
    try:
        compute_type = "int8"
        if args.device == "cuda":
            compute_type = "float16"
        
        print(f"Loading model {args.model_dir} on {args.device}...", file=sys.stderr)
        model = WhisperModel(args.model_dir, device=args.device, compute_type=compute_type)
    except Exception as e:
        if args.device == "cuda":
            print(f"CUDA load failed: {e}. Falling back to CPU...", file=sys.stderr)
            try:
                model = WhisperModel(args.model_dir, device="cpu", compute_type="int8")
            except Exception as e2:
                print(json.dumps({"success": False, "error": f"Model load failed (CPU fallback): {str(e2)}"}))
                sys.stdout.flush()
                return
        else:
            print(json.dumps({"success": False, "error": f"Model load failed: {str(e)}"}))
            sys.stdout.flush()
            return

    # Signal ready
    print(json.dumps({"success": True, "status": "ready"}))
    sys.stdout.flush()

    # Process loop
    while True:
        try:
            line = sys.stdin.readline()
            if not line:
                break
            
            line = line.strip()
            if not line:
                continue

            # Input can be just path or JSON
            # If JSON, it can contain path and prompt
            prompt = "Cuộc phỏng vấn xin việc, lập trình viên, Frontend, Backend, React, Node.js, UIT, công nghệ thông tin."
            if line.startswith('{'):
                try:
                    data = json.loads(line)
                    audio_path = data.get('path')
                    if data.get('prompt'):
                        prompt = str(data.get('prompt')) # Ensure string
                except:
                    audio_path = line
            else:
                audio_path = line
            
            if not os.path.exists(audio_path):
                print(json.dumps({"success": False, "error": "audio_path not found"}))
                sys.stdout.flush()
                continue

            # Simplify: No prompt to avoid errors
            try:
                segments, info = model.transcribe(audio_path, language="vi", beam_size=5)
                text = ""
                for segment in segments:
                    text += segment.text + " "
            except Exception as e:
                raise e
            
            text = text.strip()
            
            print(json.dumps({"success": True, "transcript": text, "language": info.language, "probability": info.language_probability}))
            sys.stdout.flush()

        except Exception as e:
            print(json.dumps({"success": False, "error": str(e)}))
            sys.stdout.flush()

if __name__ == "__main__":
    main()
