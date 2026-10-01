export function mergeUniqueContacts(existingContacts, newContacts) {
  const contactsMap = new Map();

  [...existingContacts, ...newContacts].forEach(contact => {
    const contactId = contact._id?.toString ? contact._id.toString() : String(contact._id);
    if (!contactId) return;

    const existing = contactsMap.get(contactId);
    if (!existing) {
      contactsMap.set(contactId, contact);
      return;
    }

    const existingHasProjectContact = existing.projectContactId !== null && existing.projectContactId !== undefined;
    const newHasProjectContact = contact.projectContactId !== null && contact.projectContactId !== undefined;
    if (newHasProjectContact && !existingHasProjectContact) {
      contactsMap.set(contactId, contact);
    }
  });

  return Array.from(contactsMap.values());
}
