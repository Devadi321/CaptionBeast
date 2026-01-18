from moviepy import TextClip

try:
    print("Attempting to create TextClip...")
    # List available fonts just to check if it can read system fonts
    print(f"Available fonts: {TextClip.list('font')[:5]}")
    
    txt_clip = TextClip(text="Test", font_size=70, color='white', font='Arial')
    print("TextClip created successfully.")
except Exception as e:
    print(f"Error creating TextClip: {e}")
    import traceback
    traceback.print_exc()
