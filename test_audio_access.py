import requests

print("1. Testing TTS generation...")
response = requests.post(
    'http://localhost:8000/generate-reference',
    data={'text': 'My name is Emma and I love reading books.'}
)

if response.status_code == 200:
    data = response.json()
    audio_path = data['audio_path']
    print(f"   ✅ Generated: {audio_path}")
    
    print("\n2. Testing audio file access...")
    audio_url = f"http://localhost:8000/{audio_path}"
    print(f"   URL: {audio_url}")
    
    audio_response = requests.get(audio_url)
    print(f"   Status: {audio_response.status_code}")
    
    if audio_response.status_code == 200:
        print(f"   ✅ Audio accessible! Size: {len(audio_response.content)} bytes")
        print(f"   Content-Type: {audio_response.headers.get('content-type')}")
    else:
        print(f"   ❌ Audio NOT accessible!")
        print(f"   Response: {audio_response.text}")
else:
    print(f"   ❌ Generation failed: {response.text}")
