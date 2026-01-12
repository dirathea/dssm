import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import FaqItem from '@/components/FaqItem'
import { faqItems, faqCategories } from './faq-data'

export default function Faq() {
  const groupedFaqs = faqCategories.reduce((acc, category) => {
    acc[category] = faqItems.filter(item => item.category === category)
    return acc
  }, {} as Record<string, typeof faqItems>)

  return (
    <div className="min-h-[calc(100vh-60px)] md:min-h-[calc(100vh-80px)] bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 p-4 pb-16 md:pb-20">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Personal Story Section */}
        <Card className="border-4 border-black bg-white shadow-brutal">
          <CardHeader>
            <CardTitle className="text-4xl font-black text-center">Why I Built TapLock</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-lg max-w-none">
            <div className="text-gray-700 space-y-4">
              <p>
                It all started with my banking apps.
              </p>
              <p>
                I noticed how effortless it became when they switched to passkeys with Face ID. No more typing passwords, no more forgetting complex combinations. Just a glance and I was in.
              </p>
              <p>
                Then I started paying attention. My airline apps, government services, even workplace tools - they were all adopting passkeys. And it wasn't just convenient; it felt more secure too.
              </p>
              <p>
                <strong>The realization hit me:</strong> If passkeys are secure enough for banking and government services, why are we still using complex passwords for our most sensitive data?
              </p>
              <p>
                I explored the technology and discovered that passkeys aren't just as secure as passwords - they're actually <strong>more secure</strong> in many ways:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>No phishing vulnerabilities</li>
                <li>No password reuse risks</li>
                <li>No weak password problems</li>
                <li>No server breach exposure</li>
              </ul>
              <p>
                <strong>Then the question became:</strong> If passkeys are this secure and this simple, why isn't every secure system using them?
              </p>
              <p>
                Especially for something like a secret manager, where you're storing your most sensitive information. The very tools meant to keep you safe were still relying on the outdated password paradigm.
              </p>
              <p>
                <strong>That's when I decided to build TapLock.</strong>
              </p>
              <p>
                A dead simple secret manager that only needs:
              </p>
              <ol className="list-decimal pl-6 space-y-1">
                <li>A username you choose</li>
                <li>Your passkey (fingerprint, face ID, or security key)</li>
              </ol>
              <p>
                No master passwords to remember. No recovery questions to set up. No complex encryption keys to manage.
              </p>
              <p>
                Just tap and unlock your secrets - using the same secure, effortless authentication you already use for your banking.
              </p>
              <p className="font-semibold">
                Because the best security is the kind you don't even have to think about.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card className="border-4 border-black bg-white shadow-brutal">
          <CardHeader>
            <CardTitle className="text-3xl font-black">Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {Object.entries(groupedFaqs).map(([category, items]) => (
              <div key={category}>
                <h3 className="text-xl font-bold mb-3 text-main">{category}</h3>
                <div className="space-y-3">
                  {items.map((item) => (
                    <FaqItem key={item.id} question={item.question} answer={item.answer} />
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* CTA Section */}
        <Card className="border-4 border-black bg-main text-white shadow-brutal">
          <CardContent className="text-center py-8">
            <h3 className="text-2xl font-black mb-4">Ready to Try TapLock?</h3>
            <p className="mb-6">Experience dead simple, seriously secure secret management.</p>
            <Button size="lg" variant="neutral" asChild>
              <Link to="/register">Try TapLock Now</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}