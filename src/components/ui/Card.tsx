import React from 'react';
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}
export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden ${className}`}
      {...props}>

      {children}
    </div>);

}
export function CardHeader({ children, className = '', ...props }: CardProps) {
  return (
    <div
      className={`px-6 py-4 border-b border-slate-100 ${className}`}
      {...props}>

      {children}
    </div>);

}
export function CardTitle({ children, className = '', ...props }: CardProps) {
  return (
    <h3
      className={`text-lg font-semibold text-slate-800 ${className}`}
      {...props}>

      {children}
    </h3>);

}
export function CardContent({ children, className = '', ...props }: CardProps) {
  return (
    <div className={`p-6 ${className}`} {...props}>
      {children}
    </div>);

}