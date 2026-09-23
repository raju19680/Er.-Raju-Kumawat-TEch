import React from 'react'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { Award, ShieldCheck } from 'lucide-react'
import { PrintButton } from './PrintButton'

export const metadata = {
  title: 'Course Completion Certificate',
}

export default async function CertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const certificate = await db.certificate.findUnique({
    where: { id },
    include: {
      student: true,
      course: true,
      organization: true,
    }
  })

  if (!certificate) {
    notFound()
  }

  const { student, course, organization, issuedAt } = certificate

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 print:bg-white print:p-0 print:py-0 flex flex-col items-center">
      <div className="max-w-4xl w-full mb-6 flex justify-between items-center print:hidden">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold text-gray-900">Certificate of Completion</h1>
          <p className="text-sm text-gray-500">Verify ID: {id}</p>
        </div>
        <PrintButton />
      </div>

      {/* The Certificate Container */}
      <div className="relative w-full max-w-4xl aspect-[1.414/1] bg-white border-[12px] border-amber-600 p-8 shadow-2xl print:shadow-none print:border-[10px] print:w-full print:h-[100vh] print:max-w-none print:aspect-auto overflow-hidden">
        
        {/* Background Patterns */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        
        <div className="absolute top-0 left-0 w-32 h-32 bg-amber-600 rounded-br-[100px] opacity-10" />
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-amber-600 rounded-tl-[100px] opacity-10" />

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-12 border-4 border-double border-amber-200/50">
          
          <div className="mb-8 text-amber-600">
            {organization.logo ? (
              <img src={organization.logo} alt={organization.name} className="h-20 object-contain" />
            ) : (
              <Award className="size-20 mx-auto" />
            )}
          </div>

          <h1 className="text-5xl font-serif text-gray-900 mb-2 uppercase tracking-widest">Certificate</h1>
          <h2 className="text-2xl font-serif text-amber-600 mb-10 tracking-widest uppercase">Of Completion</h2>

          <p className="text-lg text-gray-600 mb-6 font-medium">This is to proudly certify that</p>
          
          <h3 className="text-5xl font-bold text-gray-900 mb-6 font-serif border-b-2 border-gray-300 pb-2 px-12 inline-block">
            {student.name}
          </h3>

          <p className="text-lg text-gray-600 mb-6 font-medium max-w-2xl leading-relaxed">
            has successfully completed the comprehensive course requirements for
          </p>

          <h4 className="text-3xl font-bold text-gray-800 mb-16 font-serif px-8">
            {course.title}
          </h4>

          <div className="w-full grid grid-cols-3 gap-8 items-end mt-auto pb-4">
            <div className="flex flex-col items-center">
              <div className="w-48 border-b border-gray-400 pb-2 mb-2">
                <span className="text-lg font-bold text-gray-800">{format(new Date(issuedAt), 'MMMM dd, yyyy')}</span>
              </div>
              <span className="text-sm text-gray-500 font-semibold uppercase tracking-wider">Date of Issue</span>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-full border-4 border-amber-600 flex items-center justify-center bg-white rotate-[-15deg] shadow-sm">
                <div className="text-center">
                  <ShieldCheck className="size-8 mx-auto text-amber-600 mb-1" />
                  <span className="text-xs font-bold text-amber-700 uppercase leading-none block">Verified</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-48 border-b border-gray-400 pb-2 mb-2 h-10">
                {/* Signature space (could be image later) */}
                <span className="text-xl font-signature text-gray-800 italic" style={{ fontFamily: 'cursive' }}>
                  {organization.name}
                </span>
              </div>
              <span className="text-sm text-gray-500 font-semibold uppercase tracking-wider">Authorized Signature</span>
            </div>
          </div>

          <div className="absolute bottom-4 left-4 text-left">
            <p className="text-xs text-gray-400 font-mono">Verify at: {(process.env.NEXT_PUBLIC_APP_URL || '')}/certificate/{id}</p>
            <p className="text-xs text-gray-400 font-mono">Organization ID: {organization.code}</p>
          </div>
        </div>
      </div>
      
      {/* Client-side print script component */}
      <script dangerouslySetInnerHTML={{
        __html: `
          function handlePrint() {
            window.print();
          }
        `
      }} />
    </div>
  )
}
