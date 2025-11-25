export default function LoadingSpinner({
  size = 'md',
  color = 'white'
}: {
  size?: 'sm' | 'md' | 'lg'
  color?: 'white' | 'purple' | 'green' | 'red' | 'blue'
}) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-4',
    lg: 'w-12 h-12 border-4',
  }

  const colorClasses = {
    white: 'border-white/30 border-t-white',
    purple: 'border-purple-200 border-t-purple-600',
    green: 'border-green-200 border-t-green-600',
    red: 'border-red-200 border-t-red-600',
    blue: 'border-blue-200 border-t-blue-600',
  }

  return (
    <div className="flex items-center justify-center">
      <div
        className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full animate-spin`}
      />
    </div>
  )
}
