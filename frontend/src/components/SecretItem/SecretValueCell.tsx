import { TableCell } from '../ui/table'

interface SecretValueCellProps {
  revealed: boolean
  decryptedValue: string | null
}

export default function SecretValueCell({ revealed, decryptedValue }: SecretValueCellProps) {
  return (
    <TableCell className="max-w-[120px] md:max-w-md">
      {revealed && decryptedValue ? (
        <div className="font-mono text-sm break-all">
          {decryptedValue}
        </div>
      ) : (
        <span className="text-muted-foreground">••••••••••</span>
      )}
    </TableCell>
  )
}
