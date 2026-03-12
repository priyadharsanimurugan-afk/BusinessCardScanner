import { colors } from '../constants/colors';

export interface Contact {
  id: string;
  initials: string;
  name: string;
  role: string;
  company: string;
  email: string;
  phone: string;
  location: string;
  tags: Array<'Lead' | 'Partner' | 'Client' | 'Vendor' | 'Enterprise' | 'Startup'>;
  date: string;
  avatarBg: string;
}

export const contactsData: Contact[] = [
  {
    id: '1',
    initials: 'SC',
    name: 'Sarah Chen',
    role: 'VP of Sales',
    company: 'TechNova Inc.',
    email: 'sarah.chen@technova.io',
    phone: '+1 415-555-0142',
    location: 'San Francisco, CA',
    tags: ['Lead', 'Enterprise'],
    date: 'Feb 18',
    avatarBg: '#1e3a5f',
  },
  {
    id: '2',
    initials: 'MR',
    name: 'Marcus Rodriguez',
    role: 'Head of Partnerships',
    company: 'GrowthHive',
    email: 'marcus@growthhive.com',
    phone: '+1 212-555-0198',
    location: 'New York, NY',
    tags: ['Partner'],
    date: 'Feb 17',
    avatarBg: '#1a4731',
  },
  {
    id: '3',
    initials: 'PS',
    name: 'Priya Sharma',
    role: 'CTO',
    company: 'DataBridge AI',
    email: 'priya@databridge.ai',
    phone: '+91 98765-43210',
    location: 'Bangalore, India',
    tags: ['Lead', 'Startup'],
    date: 'Feb 16',
    avatarBg: '#3b1f6e',
  },
  {
    id: '4',
    initials: 'JO',
    name: 'James O\'Brien',
    role: 'Marketing Director',
    company: 'Clearpath Solutions',
    email: 'james.obrien@clearpath.co',
    phone: '+44 20-7946-0958',
    location: 'London, UK',
    tags: ['Client'],
    date: 'Feb 15',
    avatarBg: '#3d1a1a',
  },
  {
    id: '5',
    initials: 'AT',
    name: 'Aiko Tanaka',
    role: 'Product Manager',
    company: 'NexGen Labs',
    email: 'aiko.t@nexgenlabs.jp',
    phone: '+81 90-1234-5678',
    location: 'Tokyo, Japan',
    tags: ['Vendor'],
    date: 'Feb 14',
    avatarBg: '#1a3a3a',
  },
];