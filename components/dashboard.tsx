import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { dashboardStyles } from '@/components/styles/dashboardStyles';
import { colors } from '@/constants/colors';


interface Contact {
  id: string;
  initials: string;
  name: string;
  role: string;
  company: string;
  tag: 'Lead' | 'Partner' | 'Client' | 'Vendor';
  date: string;
  avatarBg: string;
}

const recentContacts: Contact[] = [
  { id: '1', initials: 'SC', name: 'Sarah Chen', role: 'VP of Sales', company: 'TechNova Inc.', tag: 'Lead', date: 'Feb 18', avatarBg: '#1e3a5f' },
  { id: '2', initials: 'MR', name: 'Marcus Rodriguez', role: 'Head of Partnerships', company: 'GrowthHive', tag: 'Partner', date: 'Feb 17', avatarBg: '#1a4731' },
  { id: '3', initials: 'PS', name: 'Priya Sharma', role: 'CTO', company: 'DataBridge AI', tag: 'Lead', date: 'Feb 16', avatarBg: '#3b1f6e' },
  { id: '4', initials: 'JO', name: 'James O\'Brien', role: 'Marketing Director', company: 'Clearpath Solutions', tag: 'Client', date: 'Feb 15', avatarBg: '#3d1a1a' },
  { id: '5', initials: 'AT', name: 'Aiko Tanaka', role: 'Product Manager', company: 'NexGen Labs', tag: 'Vendor', date: 'Feb 14', avatarBg: '#1a3a3a' },
];

const getTagStyle = (tag: string) => {
  const styles = {
    Lead: { backgroundColor: colors.leadBg, color: colors.lead },
    Partner: { backgroundColor: colors.partnerBg, color: colors.partner },
    Client: { backgroundColor: colors.clientBg, color: colors.client },
    Vendor: { backgroundColor: colors.vendorBg, color: colors.vendor },
  };
  return styles[tag as keyof typeof styles] || styles.Lead;
};

const ContactCard = ({ contact }: { contact: Contact }) => {
  const tagStyle = getTagStyle(contact.tag);
  
  return (
    <TouchableOpacity style={dashboardStyles.contactCard} activeOpacity={0.7}>
      <View style={[dashboardStyles.contactAvatar, { backgroundColor: contact.avatarBg }]}>
        <Text style={dashboardStyles.contactAvatarText}>{contact.initials}</Text>
      </View>
      <View style={dashboardStyles.contactInfo}>
        <Text style={dashboardStyles.contactName}>{contact.name}</Text>
        <Text style={dashboardStyles.contactRole}>{contact.role}</Text>
        <Text style={dashboardStyles.contactCompany}>{contact.company}</Text>
      </View>
      <View style={dashboardStyles.contactMeta}>
        <Text style={[dashboardStyles.tag, { backgroundColor: tagStyle.backgroundColor, color: tagStyle.color }]}>
          {contact.tag}
        </Text>
        <Text style={dashboardStyles.dateText}>{contact.date}</Text>
      </View>
    </TouchableOpacity>
  );
};

export default function DashboardScreen() {
  return (
    <View style={dashboardStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.navy} />
      
      <ScrollView 
        style={dashboardStyles.body} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Header */}
        <View style={dashboardStyles.header}>
          <View style={dashboardStyles.headerGlow1} />
          <View style={dashboardStyles.headerGlow2} />
          
          <View style={dashboardStyles.headerTop}>
            <View>
              <Text style={dashboardStyles.greetText}>Good morning 👋</Text>
              <Text style={dashboardStyles.titleText}>
                Welcome back,{'\n'}<Text style={dashboardStyles.titleSpan}>Alex!</Text>
              </Text>
            </View>
            <View style={dashboardStyles.avatarContainer}>
              <View style={dashboardStyles.avatar}>
                <Text style={dashboardStyles.avatarText}>AJ</Text>
              </View>
              <View style={dashboardStyles.notificationDot} />
            </View>
          </View>
        </View>

        {/* Scan CTA */}
        <TouchableOpacity style={dashboardStyles.scanCta} activeOpacity={0.8}>
          <View style={dashboardStyles.ctaIcon}>
            <Icon name="camera" size={22} color={colors.white} />
          </View>
          <View style={dashboardStyles.ctaText}>
            <Text style={dashboardStyles.ctaTitle}>Scan Business Card</Text>
            <Text style={dashboardStyles.ctaSub}>Extract contact info in seconds</Text>
          </View>
          <Icon name="chevron-forward" size={16} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>

        {/* Stats */}
        <View style={dashboardStyles.statsGrid}>
          <View style={dashboardStyles.statCard}>
            <View style={dashboardStyles.statBar} />
            <View style={dashboardStyles.statIcon}>
              <Icon name="people" size={13} color={colors.amberDark} />
            </View>
            <Text style={dashboardStyles.statValue}>128</Text>
            <Text style={dashboardStyles.statLabel}>Contacts</Text>
            <View style={dashboardStyles.statBadge}>
              <Icon name="arrow-up" size={7} color={colors.partner} />
              <Text style={dashboardStyles.statBadgeText}>+12</Text>
            </View>
          </View>
          <View style={dashboardStyles.statCard}>
            <View style={dashboardStyles.statBar} />
            <View style={dashboardStyles.statIcon}>
              <Icon name="card" size={13} color={colors.amberDark} />
            </View>
            <Text style={dashboardStyles.statValue}>156</Text>
            <Text style={dashboardStyles.statLabel}>Scanned</Text>
            <View style={dashboardStyles.statBadge}>
              <Icon name="arrow-up" size={7} color={colors.partner} />
              <Text style={dashboardStyles.statBadgeText}>+8</Text>
            </View>
          </View>
          <View style={dashboardStyles.statCard}>
            <View style={dashboardStyles.statBar} />
            <View style={dashboardStyles.statIcon}>
              <Icon name="document" size={13} color={colors.amberDark} />
            </View>
            <Text style={dashboardStyles.statValue}>34</Text>
            <Text style={dashboardStyles.statLabel}>Exports</Text>
            <View style={dashboardStyles.statBadge}>
              <Icon name="arrow-up" size={7} color={colors.partner} />
              <Text style={dashboardStyles.statBadgeText}>+3</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={dashboardStyles.sectionHead}>
          <Text style={dashboardStyles.sectionTitle}>Quick Actions</Text>
        </View>
        <View style={dashboardStyles.quickRow}>
          <TouchableOpacity style={dashboardStyles.quickBtn}>
            <View style={dashboardStyles.quickIcon}>
              <Icon name="camera" size={14} color={colors.amberDark} />
            </View>
            <Text style={dashboardStyles.quickLabel}>Scan Card</Text>
          </TouchableOpacity>
          <TouchableOpacity style={dashboardStyles.quickBtn}>
            <View style={dashboardStyles.quickIcon}>
              <Icon name="document-text" size={14} color={colors.amberDark} />
            </View>
            <Text style={dashboardStyles.quickLabel}>Export CSV</Text>
          </TouchableOpacity>
          <TouchableOpacity style={dashboardStyles.quickBtn}>
            <View style={dashboardStyles.quickIcon}>
              <Icon name="share-social" size={14} color={colors.amberDark} />
            </View>
            <Text style={dashboardStyles.quickLabel}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity style={dashboardStyles.quickBtn}>
            <View style={dashboardStyles.quickIcon}>
              <Icon name="pricetag" size={14} color={colors.amberDark} />
            </View>
            <Text style={dashboardStyles.quickLabel}>Add Tag</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Contacts */}
        <View style={dashboardStyles.sectionHead}>
          <Text style={dashboardStyles.sectionTitle}>Recent Contacts</Text>
          <TouchableOpacity>
            <Text style={dashboardStyles.sectionLink}>View all →</Text>
          </TouchableOpacity>
        </View>
        <View style={dashboardStyles.contactList}>
          {recentContacts.map(contact => (
            <ContactCard key={contact.id} contact={contact} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}