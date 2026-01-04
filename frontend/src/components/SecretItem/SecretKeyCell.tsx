import { TableCell } from '../ui/table'

interface SecretKeyCellProps {
  name: string
  createdAt: number
}

export default function SecretKeyCell({ name, createdAt }: SecretKeyCellProps) {
  return (
    <TableCell>
      <div className="font-bold text-base">{name}</div>
      <div className="text-xs text-muted-foreground mt-1">
        Created: {new Date(createdAt).toLocaleDateString()}
      </div>
    </TableCell>
  )
}
