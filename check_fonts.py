from moviepy import TextClip

try:
    # On Mac/Linux with ImageMagick, we can usually just pass the font name
    # We want to check if "Impact" works without error.
    txt_clip = TextClip(text="Test", font_size=100, color='white', font='Impact', method='label')
    print("Impact font worked.")
except Exception as e:
    print(f"Impact failed: {e}")
    try:
        txt_clip = TextClip(text="Test", font_size=100, color='white', font='Arial-Black', method='label')
        print("Arial-Black worked.")
    except Exception as e:
        print(f"Arial-Black failed: {e}")
