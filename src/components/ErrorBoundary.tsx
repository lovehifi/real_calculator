import React from 'react';
import { RotateCcw, AlertTriangle } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : String(error),
    };
  }

  private handleResetStorage = () => {
    try {
      localStorage.removeItem('rc_desktop_inputs_v2');
      localStorage.removeItem('rc_desktop_prefs_v2');
      localStorage.removeItem('rc_desktop_scenarios_v2');
    } catch {
      // ignore storage errors
    }
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="h-screen w-screen flex items-center justify-center p-6 bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <div className="max-w-md w-full rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-900/12 dark:border-white/15 shadow-2xl p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/12 text-amber-600 dark:text-amber-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-[15px] font-semibold">
                Đã phát hiện sự cố dữ liệu phiên làm việc
              </h1>
              <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-1">
                Ứng dụng gặp dữ liệu không tương thích (có thể do tệp nhập bị lỗi). Bạn có thể khôi phục bộ nhớ cục bộ về dự án mẫu mặc định.
              </p>
            </div>
          </div>

          {this.state.message && (
            <pre className="font-tabular text-[11.5px] p-3 rounded-xl bg-slate-900/5 dark:bg-white/5 text-slate-600 dark:text-slate-300 overflow-x-auto whitespace-pre-wrap">
              {this.state.message}
            </pre>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-3.5 py-2 rounded-lg text-[12.5px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-900/6 dark:hover:bg-white/10 cursor-pointer"
            >
              Tải lại trang
            </button>
            <button
              type="button"
              onClick={this.handleResetStorage}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12.5px] font-semibold bg-[#0071e3] text-white hover:brightness-105 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Khôi phục dự án mặc định</span>
            </button>
          </div>
        </div>
      </div>
    );
  }
}
