from moviepy import TextClip
import inspect

print("Inspecting TextClip.__init__ signatures:")
try:
    print(inspect.signature(TextClip.__init__))
except Exception as e:
    print(e)

print("\nInspecting TextClip (class):")
try:
    help(TextClip)
except Exception as e:
    print(e)
