import { useState } from 'react'
import { Download, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

interface RecoveryCodesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  recoveryCodes: string[]
  onConfirm: () => void
  userId: string
}

export default function RecoveryCodesDialog({
  open,
  onOpenChange,
  recoveryCodes,
  onConfirm,
  userId,
}: RecoveryCodesDialogProps) {
  const [confirmed, setConfirmed] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const codesText = recoveryCodes.join('\n')
    try {
      await navigator.clipboard.writeText(codesText)
      setCopied(true)
      toast.success('Recovery codes copied!', {
        description: 'Paste them somewhere safe.',
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast.error('Failed to copy codes')
    }
  }

  const handleDownload = () => {
    const content = `DSSM Recovery Codes for User: ${userId}
Generated on: ${new Date().toLocaleString()}

⚠️  IMPORTANT: Keep these codes safe and secure!

These recovery codes allow you to regain access to your account if you lose your passkey.
Each code can only be used once. After using a code, you'll receive new recovery codes.

${recoveryCodes.map((code, i) => `${i + 1}. ${code}`).join('\n')}

---
Do not share these codes with anyone!
Store them in a secure location (password manager, safe, etc.)
`

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dssm-recovery-codes-${userId}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success('Recovery codes downloaded!', {
      description: 'Keep the file in a safe place.',
    })
  }

  const handleConfirm = () => {
    if (!confirmed) {
      toast.error('Please confirm that you have saved your recovery codes')
      return
    }
    onConfirm()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black">
            Save Your Recovery Codes
          </DialogTitle>
          <DialogDescription className="text-base">
            These codes are your only way to recover your account if you lose your passkey.
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className="-mx-6 max-h-[500px] overflow-y-auto px-6">
          <div className="space-y-6">
            {/* Warning */}
            <div className="p-4 border-4 border-black bg-destructive/10 rounded-sm">
              <p className="text-sm font-bold text-destructive mb-2">
                ⚠️ CRITICAL: Save these codes now!
              </p>
              <ul className="text-xs space-y-1 text-muted-foreground">
                <li>• Each code can only be used <strong>once</strong></li>
                <li>• If you lose all your codes AND your passkey, you <strong>cannot</strong> recover your account</li>
                <li>• After using a code, you'll receive a new set of recovery codes</li>
              </ul>
            </div>

            {/* Recovery Codes Grid */}
            <div className="p-6 border-4 border-black bg-secondary/10 rounded-sm">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {recoveryCodes.map((code, index) => (
                  <div
                    key={index}
                    className="p-3 border-2 border-black bg-white rounded-sm font-mono text-sm font-bold text-center"
                  >
                    {code}
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleCopy}
                variant="neutral"
                className="flex-1"
                size="lg"
              >
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy All Codes
                  </>
                )}
              </Button>
              <Button
                onClick={handleDownload}
                variant="neutral"
                className="flex-1"
                size="lg"
              >
                <Download className="mr-2 h-4 w-4" />
                Download as File
              </Button>
            </div>

            {/* Confirmation Checkbox */}
            <div className="flex items-start space-x-3 p-4 border-2 border-black rounded-sm bg-white">
              <Checkbox
                id="confirm-saved"
                checked={confirmed}
                onCheckedChange={(checked) => setConfirmed(checked as boolean)}
              />
              <div className="flex-1">
                <Label
                  htmlFor="confirm-saved"
                  className="text-sm font-semibold cursor-pointer leading-tight"
                >
                  I have saved these recovery codes in a secure location
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  You will not be able to see these codes again after closing this dialog.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        <DialogFooter>
          <Button
            onClick={handleConfirm}
            disabled={!confirmed}
            className="w-full"
            size="lg"
          >
            Continue to Vault
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
