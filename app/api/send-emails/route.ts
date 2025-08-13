import { NextResponse } from 'next/server';
import { branches } from '@/config/branches';

export async function POST(request: Request) {
  const { assignmentId, branches: selectedBranches, assignmentData } = await request.json();

  // Get all email addresses
  const emailList: string[] = [];
  selectedBranches.forEach((branchId: string) => {
    const branch = branches.find(b => b.id === branchId);
    if (branch) {
      emailList.push(...branch.emails);
    }
  });

  // Here you would integrate with your email service (SendGrid, AWS SES, etc.)
  // Example with SendGrid:
  /*
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const msg = {
    to: emailList,
    from: 'assignments@yourcompany.com',
    subject: `New Assignment: ${assignmentData.title}`,
    html: `
      <h2>New Assignment Allocated</h2>
      <p><strong>Title:</strong> ${assignmentData.title}</p>
      <p><strong>Description:</strong> ${assignmentData.description}</p>
      <p><strong>Deadline:</strong> ${assignmentData.deadline}</p>
      <p>Please log in to the system to view details and update progress.</p>
    `,
  };

  await sgMail.sendMultiple(msg);
  */

  return NextResponse.json({ success: true, emailsSent: emailList.length });
}