'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { Award, Download, Calendar, Building2, User, Hash, Sparkles } from 'lucide-react'

interface Certificate {
  id: string
  certificateNumber: string
  issuedAt: string
  course: {
    id: string
    title: string
    teacher: { id: string; name: string | null; organisationId: string | null }
  }
}

export function CertificatesView() {
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/student/certificates')
      .then((r) => r.json())
      .then((data) => setCertificates(data.certificates || []))
      .finally(() => setLoading(false))
  }, [])

  const downloadCertificate = (cert: Certificate) => {
    // Generate a printable certificate HTML
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Certificate - ${cert.course.title}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: Georgia, serif; 
            background: #f0fdf4; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            min-height: 100vh; 
            padding: 40px;
          }
          .certificate {
            background: white;
            width: 900px;
            padding: 60px;
            border: 8px solid #059669;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.1);
            position: relative;
            overflow: hidden;
          }
          .corner { position: absolute; width: 120px; height: 120px; }
          .corner-tl { top: 0; left: 0; border-right: 4px solid #fbbf24; border-bottom: 4px solid #fbbf24; border-radius: 0 0 20px 0; }
          .corner-br { bottom: 0; right: 0; border-left: 4px solid #fbbf24; border-top: 4px solid #fbbf24; border-radius: 20px 0 0 0; }
          .logo { text-align: center; margin-bottom: 20px; }
          .logo-circle { 
            width: 70px; height: 70px; 
            background: linear-gradient(135deg, #10b981, #0d9488); 
            border-radius: 16px; 
            display: inline-flex; 
            align-items: center; 
            justify-content: center;
            font-size: 36px;
          }
          .brand { font-size: 24px; font-weight: bold; color: #059669; margin-top: 10px; }
          .subtitle { font-size: 14px; color: #6b7280; letter-spacing: 2px; text-transform: uppercase; }
          .title { 
            text-align: center; 
            font-size: 42px; 
            color: #1f2937; 
            margin: 30px 0 10px; 
            font-weight: bold;
          }
          .subtitle-cert { text-align: center; font-size: 18px; color: #6b7280; margin-bottom: 30px; }
          .content { text-align: center; margin: 30px 0; }
          .label { font-size: 16px; color: #6b7280; margin-bottom: 8px; }
          .name { font-size: 32px; color: #059669; font-weight: bold; margin-bottom: 20px; border-bottom: 2px solid #d1fae5; display: inline-block; padding-bottom: 8px; }
          .course-name { font-size: 22px; color: #1f2937; font-weight: bold; margin: 10px 0; }
          .teacher { font-size: 16px; color: #6b7280; margin-top: 8px; }
          .footer { 
            display: flex; 
            justify-content: space-between; 
            margin-top: 50px; 
            padding-top: 30px; 
            border-top: 2px solid #e5e7eb;
          }
          .footer-item { text-align: center; }
          .footer-label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; }
          .footer-value { font-size: 16px; color: #1f2937; font-weight: bold; margin-top: 5px; }
          .cert-number { 
            position: absolute; 
            bottom: 20px; 
            right: 60px; 
            font-size: 11px; 
            color: #9ca3af; 
            font-family: monospace;
          }
        </style>
      </head>
      <body>
        <div class="certificate">
          <div class="corner corner-tl"></div>
          <div class="corner corner-br"></div>
          <div class="logo">
            <div class="logo-circle">🎓</div>
            <div class="brand">EduSphere</div>
            <div class="subtitle">Certificate of Completion</div>
          </div>
          <div class="title">Certificate of Achievement</div>
          <div class="subtitle-cert">This certificate is proudly presented to</div>
          <div class="content">
            <div class="label">Awarded to</div>
            <div class="name">Student</div>
            <div class="label">For successfully completing</div>
            <div class="course-name">${cert.course.title}</div>
            <div class="teacher">Instructor: ${cert.course.teacher.name || 'Teacher'}</div>
          </div>
          <div class="footer">
            <div class="footer-item">
              <div class="footer-label">Date Issued</div>
              <div class="footer-value">${new Date(cert.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            </div>
            <div class="footer-item">
              <div class="footer-label">Certificate ID</div>
              <div class="footer-value">${cert.certificateNumber}</div>
            </div>
            <div class="footer-item">
              <div class="footer-label">Platform</div>
              <div class="footer-value">EduSphere</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `certificate-${cert.certificateNumber}.html`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Certificate downloaded!')
  }

  if (loading) {
    return <div className="grid gap-4 md:grid-cols-2">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-64" />)}</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Award className="w-6 h-6 text-amber-600" /> My Certificates
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Your earned certificates for completed courses</p>
      </div>

      {certificates.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center mb-4">
              <Award className="w-10 h-10 text-amber-600/50" />
            </div>
            <h3 className="font-semibold mb-2">No certificates yet</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
              Complete your enrolled courses to earn certificates. Finish all lessons in a course to unlock your certificate!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {certificates.map((cert) => (
            <Card key={cert.id} className="overflow-hidden hover:shadow-lg transition-all">
              {/* Certificate header banner */}
              <div className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 p-5 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
                <div className="relative z-10 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Award className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider opacity-90">Certificate of Completion</p>
                    <p className="font-bold text-lg">EduSphere Certified</p>
                  </div>
                </div>
              </div>
              
              <CardContent className="p-5">
                <h3 className="font-bold text-lg mb-1 line-clamp-2">{cert.course.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">by {cert.course.teacher.name}</p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs">
                    <Hash className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Cert ID:</span>
                    <span className="font-mono font-medium">{cert.certificateNumber}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Issued:</span>
                    <span className="font-medium">{new Date(cert.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                  {cert.course.teacher.organisationId && (
                    <div className="flex items-center gap-2 text-xs">
                      <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">Org:</span>
                      <span className="font-mono">{cert.course.teacher.organisationId}</span>
                    </div>
                  )}
                </div>

                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 gap-1 w-full justify-center py-2">
                  <Sparkles className="w-3.5 h-3.5" /> Course Completed Successfully
                </Badge>

                <Button onClick={() => downloadCertificate(cert)} className="w-full mt-4 bg-amber-600 hover:bg-amber-700">
                  <Download className="w-4 h-4 mr-2" /> Download Certificate
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
