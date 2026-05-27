import { motion, AnimatePresence } from "motion/react";
import { History, ChevronRight, Trash2 } from "lucide-react";
import { PresetHistoryEntry } from "../types";

interface HistorySidebarProps {
  history: PresetHistoryEntry[];
  collapsed: boolean;
  onToggle: () => void;
  onRedownload: (entry: PresetHistoryEntry) => void;
  onDelete: (id: string) => void;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  < 1)  return "just now";
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function HistorySidebar({
  history,
  collapsed,
  onToggle,
  onRedownload,
  onDelete,
}: HistorySidebarProps) {
  return (
    <motion.aside
      initial={{ width: 48 }}
      animate={{ width: collapsed ? 48 : 260 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="flex-shrink-0 border-r border-white/10 bg-[#08090C] flex flex-col overflow-hidden relative"
      style={{ minHeight: "100vh" }}
    >
      {/* Toggle button — py-6 matches main header height.
          No centered icon: traffic lights occupy the top ~30px of this zone.
          All our UI anchors to the bottom half to avoid overlap. */}
      <button
        onClick={onToggle}
        className="w-full py-6 flex items-end border-b border-white/10 hover:bg-white/5 transition-colors flex-shrink-0 relative"
        title={collapsed ? "Show preset history" : "Collapse"}
      >
        {/* Expanded: icon + label anchored left-20 (clears traffic lights), bottom-aligned */}
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute left-20 bottom-4 flex items-center gap-2"
            >
              <History className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
              <span className="text-[9px] uppercase tracking-[0.25em] text-white/30 font-mono">
                History
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Count badge — bottom-right, always below traffic lights */}
        {collapsed && history.length > 0 && (
          <span className="absolute bottom-4 right-2 w-4 h-4 rounded-full bg-blue-500 text-[8px] font-bold text-white flex items-center justify-center leading-none">
            {history.length > 9 ? "9+" : history.length}
          </span>
        )}

        {/* Chevron — bottom-right, below traffic lights */}
        <motion.div
          animate={{ rotate: collapsed ? 0 : 180 }}
          transition={{ duration: 0.2 }}
          className="absolute right-3 bottom-4"
        >
          <ChevronRight className="w-3 h-3 text-white/20" />
        </motion.div>
      </button>

      {/* List — only rendered when expanded */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex-1 overflow-y-auto"
          >
            {history.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-[9px] font-mono text-white/20 uppercase tracking-widest">No presets yet</p>
              </div>
            ) : (
              history.map((entry) => (
                <div
                  key={entry.id}
                  className="group relative border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <button
                    onClick={() => onRedownload(entry)}
                    className="w-full text-left px-4 py-3 pr-10"
                  >
                    <p className="text-[11px] font-mono text-white/70 truncate leading-tight">
                      {entry.preset.name || entry.preset.artist}
                    </p>
                    <p className="text-[9px] text-white/30 truncate mt-0.5">
                      {entry.preset.artist}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[8px] font-mono text-blue-400/60 uppercase tracking-wider truncate">
                        {entry.deviceLabel}
                      </span>
                      <span className="text-[8px] text-white/20 flex-shrink-0">
                        {relativeTime(entry.timestamp)}
                      </span>
                    </div>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(entry.id); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-white/20 hover:text-red-400"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
}
