// ─── FlowMind WAV Audio Recorder Utility for Gnani Prisma STT ─────────────────
// Captures microphone audio, downsamples cleanly to 16kHz 16-bit Mono PCM,
// and produces self-contained WAV audio files with standard 44-byte RIFF headers.

export class WavSegmentRecorder {
  private audioContext: AudioContext | null = null
  private mediaStream: MediaStream | null = null
  private sourceNode: MediaStreamAudioSourceNode | null = null
  private processorNode: ScriptProcessorNode | null = null
  private sampleBuffers: Float32Array[] = []
  private totalSamples = 0
  private isRecording = false

  async start(): Promise<boolean> {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      this.audioContext = new AudioCtx()
      
      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream)
      // 4096 buffer size gives ~90ms latency at 44.1/48kHz
      this.processorNode = this.audioContext.createScriptProcessor(4096, 1, 1)

      this.sampleBuffers = []
      this.totalSamples = 0
      this.isRecording = true

      this.processorNode.onaudioprocess = (e) => {
        if (!this.isRecording) return
        const channelData = e.inputBuffer.getChannelData(0)
        // Clone samples into memory
        const clone = new Float32Array(channelData.length)
        clone.set(channelData)
        this.sampleBuffers.push(clone)
        this.totalSamples += clone.length
      }

      this.sourceNode.connect(this.processorNode)
      this.processorNode.connect(this.audioContext.destination)
      return true
    } catch (err: any) {
      console.warn('[WavRecorder] Failed to start microphone:', err)
      return false
    }
  }

  /**
   * Flushes the current accumulated audio buffer into a valid 16kHz 16-bit Mono WAV,
   * then resets the internal buffer to continue recording the next segment immediately.
   */
  flushSegment(): { base64: string; duration: number } | null {
    if (!this.isRecording || this.totalSamples === 0 || !this.audioContext) return null

    // Merge collected buffers
    const inputSampleRate = this.audioContext.sampleRate
    const merged = new Float32Array(this.totalSamples)
    let offset = 0
    for (const buf of this.sampleBuffers) {
      merged.set(buf, offset)
      offset += buf.length
    }

    // Reset buffer for next segment immediately
    this.sampleBuffers = []
    this.totalSamples = 0

    // Only process if more than ~0.4s of audio
    const rawDuration = merged.length / inputSampleRate
    if (rawDuration < 0.4) return null

    // Downsample to 16,000 Hz for Gnani Prisma STT
    const targetSampleRate = 16000
    const downsampled = downsampleBuffer(merged, inputSampleRate, targetSampleRate)
    const wavBuffer = encodeWav(downsampled, targetSampleRate)

    const base64 = bufferToBase64(wavBuffer)
    return {
      base64,
      duration: rawDuration,
    }
  }

  stop(): { base64: string; duration: number } | null {
    const finalSegment = this.flushSegment()
    this.isRecording = false

    try {
      this.processorNode?.disconnect()
      this.sourceNode?.disconnect()
      this.mediaStream?.getTracks().forEach((t) => t.stop())
      if (this.audioContext && this.audioContext.state !== 'closed') {
        this.audioContext.close().catch(() => {})
      }
    } catch (e) {
      console.warn('[WavRecorder] Error during cleanup:', e)
    }

    this.processorNode = null
    this.sourceNode = null
    this.mediaStream = null
    this.audioContext = null
    this.sampleBuffers = []
    this.totalSamples = 0

    return finalSegment
  }
}

/**
 * Downsamples audio buffer via linear interpolation
 */
function downsampleBuffer(buffer: Float32Array, inputRate: number, outputRate: number): Float32Array {
  if (inputRate === outputRate) return buffer
  const ratio = inputRate / outputRate
  const newLength = Math.round(buffer.length / ratio)
  const result = new Float32Array(newLength)
  let offsetResult = 0
  let offsetBuffer = 0

  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * ratio)
    let accum = 0
    let count = 0
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
      accum += buffer[i]
      count++
    }
    result[offsetResult] = count > 0 ? accum / count : 0
    offsetResult++
    offsetBuffer = nextOffsetBuffer
  }
  return result
}

/**
 * Encodes Float32 PCM samples into a self-contained 16-bit Mono WAV ArrayBuffer
 */
function encodeWav(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const buffer = new ArrayBuffer(44 + samples.length * 2)
  const view = new DataView(buffer)

  // RIFF identifier
  writeString(view, 0, 'RIFF')
  // file length
  view.setUint32(4, 36 + samples.length * 2, true)
  // RIFF type
  writeString(view, 8, 'WAVE')
  // format chunk identifier
  writeString(view, 12, 'fmt ')
  // format chunk length
  view.setUint32(16, 16, true)
  // sample format (1 = PCM)
  view.setUint16(20, 1, true)
  // channel count (1 = mono)
  view.setUint16(22, 1, true)
  // sample rate
  view.setUint32(24, sampleRate, true)
  // byte rate (sampleRate * 1 channel * 2 bytes/sample)
  view.setUint32(28, sampleRate * 2, true)
  // block align (1 channel * 2 bytes/sample)
  view.setUint16(32, 2, true)
  // bits per sample
  view.setUint16(34, 16, true)
  // data chunk identifier
  writeString(view, 36, 'data')
  // data chunk length
  view.setUint32(40, samples.length * 2, true)

  // Write 16-bit PCM samples
  let offset = 44
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
  }

  return buffer
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i))
  }
}

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return window.btoa(binary)
}

