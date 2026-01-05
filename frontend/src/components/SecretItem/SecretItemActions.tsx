import { useState } from 'react'
import { Eye, EyeOff, Copy, Trash2, Pencil, MoreVertical } from 'lucide-react'
import { Button } from '../ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import SecretForm from '../SecretForm'

interface SecretItemActionsProps {
  secret: {
    id: number
    name: string
    encrypted_value: string
    iv: string
  }
  token: string
  revealed: boolean
  loading: boolean
  onReveal: () => void
  onCopy: () => void
  onDelete: () => void
  decryptSecret: () => Promise<string>
  onUpdate: () => void
}

export default function SecretItemActions({
  secret,
  token,
  revealed,
  loading,
  onReveal,
  onCopy,
  onDelete,
  decryptSecret,
  onUpdate,
}: SecretItemActionsProps) {
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleEdit = () => setShowEditDialog(true)
  const handleDelete = () => setShowDeleteDialog(true)

  return (
    <>
      {/* Desktop: Show all action buttons (md and above) */}
      <div className="hidden md:flex justify-end gap-2">
        <Button variant="ghost" size="icon" title="Edit" onClick={handleEdit}>
          <Pencil className="h-5 w-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onReveal}
          disabled={loading}
          title={revealed ? 'Hide' : 'Reveal'}
        >
          {revealed ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onCopy}
          title="Copy to clipboard"
        >
          <Copy className="h-5 w-5" />
        </Button>

        <Button variant="ghost" size="icon" title="Delete" onClick={handleDelete}>
          <Trash2 className="h-5 w-5 text-destructive" />
        </Button>
      </div>

      {/* Mobile: Show three-dot menu (below md) */}
      <div className="md:hidden flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" title="Actions">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-white border-2 border-black shadow-brutal">
            <DropdownMenuItem onClick={handleEdit} className="bg-white hover:bg-gray-100 cursor-pointer">
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onReveal} disabled={loading} className="bg-white hover:bg-gray-100 cursor-pointer">
              {revealed ? (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Hide
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Reveal
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onCopy} className="bg-white hover:bg-gray-100 cursor-pointer">
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDelete} className="text-destructive bg-white hover:bg-red-50 cursor-pointer">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Shared Edit Dialog - Works for Both Desktop and Mobile */}
      <SecretForm
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSuccess={onUpdate}
        token={token}
        secret={secret}
        decryptSecret={decryptSecret}
      />

      {/* Shared Delete Confirmation Dialog - Works for Both Desktop and Mobile */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Secret?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{secret.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              <Button variant="outline">Cancel</Button>
            </AlertDialogCancel>
            <AlertDialogAction>
              <Button variant="destructive" onClick={onDelete}>
                Delete
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
