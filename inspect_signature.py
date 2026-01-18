from moviepy import TextClip
import inspect

try:
    print(inspect.signature(TextClip.__init__))
except Exception as e:
    print(e)
