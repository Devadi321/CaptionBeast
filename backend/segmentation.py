import requests
import json
import re

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "llama3" # Or 'mistral', user can change this

def analyze_transcript_with_llm(transcript_text):
    """
    Sends the transcript to a local LLM (Ollama) to identify viral clips.
    Returns a list of dicts: {start, end, score, reason}
    """
    print(f"Sending transcript (len={len(transcript_text)}) to Ollama...")
    
    prompt = f"""
    You are an expert video editor. I will give you a transcript of a video.
    Your job is to identify 1 to 3 "viral" segments that are 30-60 seconds long.
    Additional instructions:
    - Look for complete thoughts, funny moments, or strong hooks.
    - Return the result ONLY as a JSON list. 
    - Format: [{{"start_text": "first few words", "end_text": "last few words", "reason": "why it is good", "score": 90}}]
    
    TRANSCRIPT:
    {transcript_text[:12000]} 
    (Transcript truncated for context limit if too long)
    
    Identify the best clips now. Return valid JSON only.
    """

    try:
        response = requests.post(OLLAMA_URL, json={
            "model": MODEL_NAME,
            "prompt": prompt,
            "stream": False,
            "format": "json" 
        })
        
        if response.status_code != 200:
            print(f"Ollama Error: {response.text}")
            return []
            
        result_json = response.json()
        content = result_json.get("response", "")
        print(f"Ollama Response: {content[:200]}...")
        
        # Parse JSON
        min_seconds=15
        clips = []
        try:
            parsed = json.loads(content)
            # We need to map start_text/end_text back to timestamps. 
            # This is tricky with just text. 
            # Ideally, we pass segments to the LLM or doing fuzzy matching.
            # For this MVP, let's ask the LLM to give us estimated word indices or just use logic to find these phrases in the Word-Level timestamps.
            # Actually, let's refine the prompt to ask for *approximate* word counts or we will do fuzzy matching in the parent function.
            # Simplified return for now as the 'main.py' needs to handle the logic.
            return parsed
        except json.JSONDecodeError:
            print("Failed to parse LLM JSON")
            return []

    except Exception as e:
        print(f"LLM Connection Error: {e}")
        return []

def find_timestamps_for_clip(words, start_text, end_text):
    """
    Fuzzy match the start_text and end_text in the word list to find start/end times.
    words: list of {word, start, end}
    """
    # Simple implementation: find the first occurrence of the sequence
    # This is a naive O(N*M) search, sufficient for MVP
    
    start_time = 0.0
    end_time = 0.0
    
    start_tokens = start_text.lower().split()
    end_tokens = end_text.lower().split()
    
    # helper to find sequence
    def find_sequence(tokens, word_list):
        if not tokens: return -1
        for i in range(len(word_list) - len(tokens) + 1):
            match = True
            for j in range(len(tokens)):
                if word_list[i+j]['word'].strip().lower().replace('.', '').replace(',', '') != tokens[j].replace('.', '').replace(',', ''):
                    match = False
                    break
            if match:
                return i
        return -1

    start_idx = find_sequence(start_tokens, words)
    if start_idx != -1:
        start_time = words[start_idx]['start']
        
        # Look for end AFTER start
        remaining_words = words[start_idx:]
        end_idx_local = find_sequence(end_tokens, remaining_words)
        
        if end_idx_local != -1:
            # End time is end of the last word in the sequence
            # end_idx_local is relative to remaining_words
            absolute_end_idx = start_idx + end_idx_local + len(end_tokens) - 1
            if absolute_end_idx < len(words):
                end_time = words[absolute_end_idx]['end']
    
    return start_time, end_time
