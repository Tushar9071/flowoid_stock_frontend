'use client';

import React from 'react';
import { redirect } from 'next/navigation';

export default function TenantsPage() {
  // Redirect to users page as per current sidebar configuration
  redirect('/admin/users');
  return null;
}
