import { useState, useRef, useEffect } from 'react'
import { Bot, User, Send, Copy, Check } from 'lucide-react'
import { Button } from '~/components/ui/button'
import ReactMarkdown from 'react-markdown'
import { askPrCopilot } from '~/lib/backend'
import type { ReviewTarget, ChatMessage } from './types'
import { QUICK_PROMPTS, formatCopilotMessage } from './types'

type ReviewCopilotTabProps = {
  target: ReviewTarget | null
  messages: Array<ChatMessage>
  setMessages: React.Dispatch<React.SetStateAction<Array<ChatMessage>>>
}

export function ReviewCopilotTab({
  target,
  messages,
  setMessages,
}: ReviewCopilotTabProps) {
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [copiedMsgIndex, setCopiedMsgIndex] = useState<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  // Auto-scroll chat to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, chatLoading])

  const handleCopyText = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedMsgIndex(index)
    setTimeout(() => setCopiedMsgIndex(null), 2000)
  }

  const handleSendMessage = async (
    customPromptOrEvent?: string | React.FormEvent,
  ) => {
    if (
      customPromptOrEvent &&
      typeof customPromptOrEvent === 'object' &&
      'preventDefault' in customPromptOrEvent
    ) {
      customPromptOrEvent.preventDefault()
    }

    const textToSend =
      typeof customPromptOrEvent === 'string'
        ? customPromptOrEvent.trim()
        : chatInput.trim()

    if (!textToSend || !target || chatLoading) return

    const userTimestamp = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })

    setMessages((prev) => [
      ...prev,
      { sender: 'user', text: textToSend, time: userTimestamp },
    ])
    if (typeof customPromptOrEvent !== 'string') {
      setChatInput('')
    }
    setChatLoading(true)

    try {
      const resp = await askPrCopilot(
        target.repoName,
        target.prNumber,
        textToSend,
      )
      const aiTimestamp = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
      const cleaned = formatCopilotMessage(resp)
      setMessages((prev) => [
        ...prev,
        { sender: 'ai', text: cleaned, time: aiTimestamp },
      ])
    } catch (err) {
      const aiTimestamp = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: `**Error:** ${err instanceof Error ? err.message : String(err)}`,
          time: aiTimestamp,
        },
      ])
    } finally {
      setChatLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[54vh] sm:h-[60vh] md:h-[64vh] space-y-3">
      {/* Message Thread */}
      <div className="flex-1 overflow-y-auto space-y-3 p-4 bg-black/40 border border-zinc-800 rounded-none">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-zinc-600 space-y-4">
            <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <Bot className="w-6 h-6 text-zinc-400" />
            </div>
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-zinc-300">
                Interactive PR Copilot
              </p>
              <p className="text-xs text-zinc-500 mt-1 max-w-md">
                Ask questions about code changes, security risks, logic bugs, or
                proposed remediations.
              </p>
            </div>
            {/* Suggested Quick Prompts */}
            <div className="flex flex-wrap gap-2 justify-center pt-2 max-w-lg">
              {QUICK_PROMPTS.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleSendMessage(item.prompt)}
                  className="text-[11px] font-mono bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-white px-3 py-1.5 transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 text-xs sm:text-sm leading-relaxed ${
                msg.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.sender === 'ai' && (
                <div className="w-6 h-6 rounded-none bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot size={13} className="text-zinc-400" />
                </div>
              )}
              <div
                className={`group relative p-3 sm:p-4 max-w-[85%] rounded-none ${
                  msg.sender === 'user'
                    ? 'bg-white text-black font-sans font-medium'
                    : 'bg-zinc-900/60 border border-zinc-800 text-zinc-200'
                }`}
              >
                <div className="flex items-center justify-between gap-4 mb-1">
                  <span
                    className={`font-mono text-[10px] uppercase tracking-wider ${
                      msg.sender === 'user' ? 'text-zinc-600' : 'text-zinc-500'
                    }`}
                  >
                    {msg.sender === 'user' ? 'You' : 'PR Copilot'} • {msg.time}
                  </span>
                  {msg.sender === 'ai' && (
                    <button
                      onClick={() => handleCopyText(msg.text, i)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500 hover:text-white"
                      title="Copy response"
                    >
                      {copiedMsgIndex === i ? (
                        <Check size={12} className="text-emerald-400" />
                      ) : (
                        <Copy size={12} />
                      )}
                    </button>
                  )}
                </div>
                {msg.sender === 'user' ? (
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                ) : (
                  <div className="prose prose-invert prose-xs max-w-none prose-p:leading-relaxed prose-pre:bg-black prose-pre:border prose-pre:border-zinc-800">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                )}
              </div>
              {msg.sender === 'user' && (
                <div className="w-6 h-6 rounded-none bg-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
                  <User size={13} className="text-zinc-300" />
                </div>
              )}
            </div>
          ))
        )}
        {chatLoading && (
          <div className="flex gap-3 text-xs sm:text-sm justify-start">
            <div className="w-6 h-6 rounded-none bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
              <Bot size={13} className="text-zinc-400 animate-pulse" />
            </div>
            <div className="p-3 bg-zinc-900/60 border border-zinc-800 text-zinc-400 flex items-center gap-2 font-mono text-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[11px] uppercase tracking-wider">
                Copilot analyzing...
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <form onSubmit={handleSendMessage} className="flex gap-2 shrink-0">
        <input
          type="text"
          placeholder="Ask a question about this PR... (e.g. 'Explain line 42 in auth.ts')"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          disabled={chatLoading}
          className="flex-1 bg-black border border-zinc-800 text-white font-sans text-xs sm:text-sm p-3.5 rounded-none focus:outline-none focus:border-zinc-500"
        />
        <Button
          type="submit"
          disabled={!chatInput.trim() || chatLoading}
          className="bg-white text-black hover:bg-zinc-200 rounded-none font-mono text-xs uppercase px-5 h-auto"
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  )
}
