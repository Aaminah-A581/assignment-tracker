import { NextResponse } from 'next/server';
import { branches } from '@/config/branches';

export async function POST(request: Request) {
  try {
    const { assignmentId, branches: selectedBranches, assignmentData } = await request.json();

    // Get all email addresses
    const emailList: string[] = [];
    selectedBranches.forEach((branchCode: string | number) => {
      const branch = branches.find(b => b.code === branchCode || b.code === Number(branchCode));
      if (branch) {
        emailList.push(...branch.emails);
      }
    });

    // Here you would integrate with your email service (SendGrid, AWS SES, etc.)
    // For now, we'll just return success
    
    console.log(`Would send emails to ${emailList.length} addresses:`, emailList);

    return NextResponse.json({ 
      success: true, 
      emailsSent: emailList.length,
      recipients: emailList 
    });
  } catch (error) {
    console.error('Email sending error:', error);
    return NextResponse.json(
      { error: 'Failed to send emails' },
      { status: 500 }
    );
  }
}