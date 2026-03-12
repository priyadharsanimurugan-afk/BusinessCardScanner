import { contactsStyles } from '@/components/styles/contactStyles';
import { colors } from '@/constants/colors';
import { Contact, contactsData } from '@/types/contact';
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';


type ChipType = 'All' | 'Lead' | 'Partner' | 'Client' | 'Vendor';

const getTagStyle = (tag: string) => {
  const styles = {
    Lead: { backgroundColor: colors.leadBg, color: colors.lead },
    Partner: { backgroundColor: colors.partnerBg, color: colors.partner },
    Client: { backgroundColor: colors.clientBg, color: colors.client },
    Vendor: { backgroundColor: colors.vendorBg, color: colors.vendor },
    Enterprise: { backgroundColor: colors.enterpriseBg, color: colors.enterprise },
    Startup: { backgroundColor: colors.startupBg, color: colors.startup },
  };
  return styles[tag as keyof typeof styles] || styles.Lead;
};

const ContactCard = ({ contact }: { contact: Contact }) => {
  return (
    <TouchableOpacity style={contactsStyles.contactCard} activeOpacity={0.7}>
      <View style={[contactsStyles.contactAvatar, { backgroundColor: contact.avatarBg }]}>
        <Text style={contactsStyles.contactAvatarText}>{contact.initials}</Text>
      </View>
      
      <View style={contactsStyles.contactBody}>
        <Text style={contactsStyles.contactName}>{contact.name}</Text>
        <Text style={contactsStyles.contactRole}>{contact.role}</Text>
        <Text style={contactsStyles.contactCompany}>{contact.company}</Text>
        
        <View style={contactsStyles.contactDetails}>
          <View style={contactsStyles.contactRow}>
            <Icon name="mail-outline" size={10} color={colors.amberDark} />
            <Text style={contactsStyles.contactRowText} numberOfLines={1}>{contact.email}</Text>
          </View>
          <View style={contactsStyles.contactRow}>
            <Icon name="call-outline" size={10} color={colors.amberDark} />
            <Text style={contactsStyles.contactRowText} numberOfLines={1}>{contact.phone}</Text>
          </View>
          <View style={contactsStyles.contactRow}>
            <Icon name="location-outline" size={10} color={colors.amberDark} />
            <Text style={contactsStyles.contactRowText} numberOfLines={1}>{contact.location}</Text>
          </View>
        </View>
        
        <View style={contactsStyles.contactTags}>
          {contact.tags.map((tag, index) => {
            const tagStyle = getTagStyle(tag);
            return (
              <Text key={index} style={[contactsStyles.tag, { backgroundColor: tagStyle.backgroundColor, color: tagStyle.color }]}>
                {tag}
              </Text>
            );
          })}
        </View>
      </View>
      
      <View style={contactsStyles.contactRight}>
        <Text style={contactsStyles.contactDate}>{contact.date}</Text>
        <View style={contactsStyles.contactMore}>
          <Icon name="ellipsis-vertical" size={12} color={colors.muted} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function ContactsScreen() {
  const [activeChip, setActiveChip] = useState<ChipType>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const chips: { label: ChipType; icon: string; color?: string }[] = [
    { label: 'All', icon: 'grid-outline' },
    { label: 'Lead', icon: 'ellipse', color: colors.lead },
    { label: 'Partner', icon: 'ellipse', color: colors.partner },
    { label: 'Client', icon: 'ellipse', color: colors.client },
    { label: 'Vendor', icon: 'ellipse', color: colors.vendor },
  ];

  return (
    <View style={contactsStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.navy} />
      
      <ScrollView 
        style={contactsStyles.body} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
                paddingBottom: 20,
                backgroundColor: colors.phoneBg,
              }}
      >
        {/* Header */}
        <View style={contactsStyles.header}>
          <View style={contactsStyles.headerGlow} />
          
          <View style={contactsStyles.headerTop}>
            <View>
              <Text style={contactsStyles.greetText}>Your network</Text>
              <Text style={contactsStyles.titleText}>Contacts</Text>
            </View>
            <View style={contactsStyles.headerActions}>
              <TouchableOpacity style={contactsStyles.headerBtn}>
                <Icon name="document-text-outline" size={14} color={colors.amber} />
              </TouchableOpacity>
              <TouchableOpacity style={contactsStyles.headerBtn}>
                <Icon name="add-outline" size={14} color={colors.amber} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={contactsStyles.chips}>
          {chips.map((chip) => (
            <TouchableOpacity
              key={chip.label}
              style={[
                contactsStyles.chip,
                activeChip === chip.label ? contactsStyles.chipActive : contactsStyles.chipInactive,
              ]}
              onPress={() => setActiveChip(chip.label)}
            >
              {chip.label === 'All' ? (
                <Icon name="grid-outline" size={10} color={activeChip === chip.label ? colors.white : colors.muted} />
              ) : (
                <Icon name="ellipse" size={10} color={chip.color} />
              )}
              <Text style={activeChip === chip.label ? contactsStyles.chipTextActive : contactsStyles.chipTextInactive}>
                {chip.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Search */}
        <View style={contactsStyles.searchWrap}>
          <Icon name="search-outline" size={14} color={colors.muted} style={contactsStyles.searchIcon} />
          <TextInput
            style={contactsStyles.searchInput}
            placeholder="Search by name, company, email..."
            placeholderTextColor={colors.inputPlaceholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity style={contactsStyles.searchFilter}>
            <Icon name="options-outline" size={12} color={colors.amber} />
          </TouchableOpacity>
        </View>

        {/* Count & Sort */}
        <View style={contactsStyles.countBar}>
          <Text style={contactsStyles.countText}>
            Showing <Text style={contactsStyles.countStrong}>{contactsData.length}</Text> contacts
          </Text>
          <TouchableOpacity style={contactsStyles.sortBtn}>
            <Icon name="swap-vertical-outline" size={11} color={colors.amberDark} />
            <Text style={contactsStyles.sortText}>Newest</Text>
          </TouchableOpacity>
        </View>

        {/* Contacts List */}
        <View style={contactsStyles.contactList}>
          {contactsData.map((contact) => (
            <ContactCard key={contact.id} contact={contact} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}