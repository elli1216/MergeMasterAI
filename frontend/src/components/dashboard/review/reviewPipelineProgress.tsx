import { Bot, CheckCircle2 } from 'lucide-react'
import { PIPELINE_STAGES } from '~/store/reviewStore'

type ReviewPipelineProgressProps = {
  currentStageIndex: number
}

export function ReviewPipelineProgress({
  currentStageIndex,
}: ReviewPipelineProgressProps) {
  const currentStage = PIPELINE_STAGES[currentStageIndex]

  return (
    <div className="py-4 sm:py-8 max-w-3xl mx-auto space-y-6 sm:space-y-8">
      {/* Progress Meter Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between font-mono text-xs text-zinc-400">
          <span className="flex items-center gap-2 uppercase tracking-widest text-white font-bold">
            <Bot className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>Autonomous Multi-Agent Pipeline</span>
          </span>
          <span className="text-zinc-400 font-mono text-xs">
            Stage {currentStageIndex + 1} of {PIPELINE_STAGES.length} (
            {Math.round(
              ((currentStageIndex + 1) / PIPELINE_STAGES.length) * 100,
            )}
            %)
          </span>
        </div>
        <div className="h-1.5 w-full bg-zinc-900 border border-zinc-800 overflow-hidden">
          <div
            className="h-full bg-linear-to-r from-emerald-500 via-cyan-400 to-amber-400 transition-all duration-500"
            style={{
              width: `${
                ((currentStageIndex + 1) / PIPELINE_STAGES.length) * 100
              }%`,
            }}
          />
        </div>
      </div>

      {/* Active Stage Hero Card */}
      <div className="p-5 border border-zinc-800 bg-linear-to-b from-zinc-900/70 to-black space-y-2 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="px-2 py-0.5 bg-amber-950/60 border border-amber-800/80 text-amber-300 font-mono text-[10px] uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            <span>Active State: Stage {currentStageIndex + 1}</span>
          </span>
          <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
            Modal Locked During Run
          </span>
        </div>
        <h3 className="text-base sm:text-lg font-bold text-white font-sans tracking-tight">
          {currentStage?.name}
        </h3>
        <p className="text-xs sm:text-sm text-zinc-400 font-sans leading-relaxed">
          {currentStage?.subtitle}
        </p>
      </div>

      {/* 5-Step Pipeline Sequence Stepper */}
      <div className="space-y-2">
        <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
          Multi-Agent Pipeline Execution Sequence
        </p>
        <div className="grid grid-cols-1 gap-2">
          {PIPELINE_STAGES.map((stage, idx) => {
            const isCompleted = idx < currentStageIndex
            const isCurrent = idx === currentStageIndex

            return (
              <div
                key={stage.id}
                className={`flex items-start gap-3 p-3 border font-mono text-xs transition-all ${
                  isCurrent
                    ? 'border-amber-700/80 bg-amber-950/20 text-white shadow-sm'
                    : isCompleted
                    ? 'border-zinc-800/80 bg-zinc-900/30 text-zinc-300'
                    : 'border-zinc-900/60 bg-black/40 text-zinc-600 opacity-60'
                }`}
              >
                <div className="shrink-0 mt-0.5">
                  {isCompleted ? (
                    <CheckCircle2 size={16} className="text-emerald-400" />
                  ) : isCurrent ? (
                    <div className="w-4 h-4 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-zinc-700 flex items-center justify-center text-[9px] text-zinc-600 font-bold">
                      {stage.id}
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-semibold ${
                        isCurrent
                          ? 'text-amber-300'
                          : isCompleted
                          ? 'text-zinc-200'
                          : 'text-zinc-500'
                      }`}
                    >
                      Step {stage.id}: {stage.name}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                      {isCompleted
                        ? 'Done'
                        : isCurrent
                        ? 'In Progress'
                        : 'Queued'}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 line-clamp-1 font-sans">
                    {stage.subtitle}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Agent Execution Log Box */}
      <div className="p-3.5 bg-black border border-zinc-800 space-y-1.5 font-mono text-[11px]">
        <div className="flex items-center justify-between text-zinc-500 text-[10px] uppercase tracking-wider border-b border-zinc-900 pb-1.5 mb-1.5">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Live Agent Execution Stream</span>
          </span>
          <span>IBM Granite 3.1 Code & Instruct</span>
        </div>
        <div className="space-y-1 text-zinc-400">
          {PIPELINE_STAGES.slice(0, currentStageIndex + 1).map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <span className="text-zinc-600">[{`0${i + 1}`}]</span>
              <span
                className={
                  i === currentStageIndex
                    ? 'text-amber-300 font-bold animate-pulse'
                    : 'text-zinc-400'
                }
              >
                → {s.log}...
              </span>
              <span className="text-[10px] text-zinc-600 ml-auto">
                {i === currentStageIndex ? 'ACTIVE' : 'OK'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
