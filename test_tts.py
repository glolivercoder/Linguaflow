import requests
import json

# Test TTS generation
print("Testing TTS generation...")

try:
    response = requests.post(
        'http://localhost:8000/generate-reference',
        data={'text': 'Hello everyone, this is a test.'}
    )
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"\n✅ SUCCESS!")
        print(f"Audio Path: {data.get('audio_path')}")
    else:
        print(f"\n❌ ERROR!")
        
except Exception as e:
    print(f"\n❌ EXCEPTION: {e}")
