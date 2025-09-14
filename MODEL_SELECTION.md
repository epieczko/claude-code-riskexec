# Model Selection Guide

This document outlines recommended language models for tasks used with Claude Code RiskExec. It highlights when to use hosted services versus running open‑source models locally via the Cloud Code Router to reduce cost.

| Model | Provider | Type | Strengths | Recommended Use |
|-------|----------|------|-----------|-----------------|
| Claude 3.5 Sonnet | Anthropic | Hosted | Balanced reasoning and strong code generation | General development, code explanation |
| GPT‑4o Mini | OpenAI | Hosted | Fast generation for quick iteration | Lightweight chat, UI prototyping |
| Llama 3 8B Instruct | Meta | Open source | Runs on modest local hardware | Offline or cost‑sensitive development |
| Llama 3 70B Instruct | Meta | Open source | Higher accuracy with significant compute needs | Local deployment when quality is critical |
| Mixtral 8×7B | Mistral | Open source | Mixture‑of‑experts model with strong coding ability | Local high‑quality code generation |
| DeepSeek‑Coder 33B | DeepSeek | Open source | Multilingual code generation and reasoning | Specialized codebases or multi‑language projects |
| StarCoder2 15B | BigCode | Open source | Trained specifically for code | Local code understanding and completion |
| Phi‑3 Mini 14B | Microsoft | Open source | Efficient general reasoning in a small footprint | Edge devices and memory‑constrained setups |
| VaultGemma 1B | Google | Open source | Differentially private training and tiny size | Privacy‑sensitive or on‑device workloads |

## Using Open Source Models

Open‑source models can be executed on a local machine and accessed through the Cloud Code Router. Configure the router to point to your local model server (e.g., Ollama or other inference engines) and route appropriate requests to it. This minimizes cloud usage and keeps sensitive code on your device.

## Choosing a Model

- **Accuracy first:** prefer hosted models like Claude 3.5 Sonnet or GPT‑4o Mini when maximum quality is required.
- **Budget or offline work:** use local models such as Llama 3 8B or Mixtral 8×7B through the router.
- **Code‑heavy tasks:** favor models tuned for coding such as StarCoder2 or Mixtral.

## Task‑Based Recommendations

| Task | Primary | Secondary | Tertiary |
|------|---------|-----------|----------|
| General chat & reasoning | Claude 3.5 Sonnet | GPT‑4o Mini | Llama 3 70B Instruct |
| Code generation | Mixtral 8×7B | DeepSeek‑Coder 33B | StarCoder2 15B |
| Edge or privacy‑sensitive | VaultGemma 1B | Llama 3 8B Instruct | Phi‑3 Mini 14B |

## Continuous Evaluation

The model landscape evolves quickly. New releases like [VaultGemma 1B](https://www.marktechpost.com/2025/09/13/google-ai-releases-vaultgemma-the-largest-and-most-capable-open-model-1b-parameters-trained-from-scratch-with-differential-privacy/) demonstrate the pace of change. We periodically benchmark models and update primary/secondary/tertiary rankings to match the latest performance and cost data.
