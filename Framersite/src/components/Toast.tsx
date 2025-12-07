export interface ToastProps {
    show: boolean;
    message: string;
    type: 'success' | 'error';
}

export function Toast({ show, message, type }: ToastProps) {
    return (
        <div className={`toast ${show ? 'show' : ''} ${type === 'error' ? 'error' : ''}`}>
            <span className="toast-icon">{type === 'error' ? '⚠️' : '✨'}</span>
            <span className="toast-message">{message}</span>
        </div>
    );
}
