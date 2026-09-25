const fs = require('fs');

const modalPath = 'leadgen-frontend/src/components/ActivityLogModal.jsx';
let content = fs.readFileSync(modalPath, 'utf8');

// 1. Add props
content = content.replace(
  'activityId, editMode = false, lastActivity = null',
  'activityId, editMode = false, lastActivity = null, isBulk = false, selectedContacts = new Set(), contacts = []'
);

// 2. Modify handleSubmit
const submitStart = content.indexOf('const handleSubmit = async (e) => {');
const submitEnd = content.indexOf('  if (!isOpen) return null;'); // the line right after handleSubmit ends

const newSubmit = `
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      const notesWithContact = formData.conversationNotes.trim() || '';
      const callDateValue = formData.callDate && formData.callDate.trim() ? formData.callDate.trim() : null;
      const emailDateValue = formData.emailDate && formData.emailDate.trim() ? formData.emailDate.trim() : null;
      const linkedinDateValue = formData.linkedinDate && formData.linkedinDate.trim() ? formData.linkedinDate.trim() : null;
      
      const payloadBase = {
        subject: formData.subject,
        template: formData.message,
        conversationNotes: notesWithContact,
        nextAction: formData.nextAction,
        nextActionDate: formData.nextActionDate,
        status: formData.status || null,
        linkedInAccountName: formData.linkedInAccountName || null,
        lnRequestSent: formData.lnRequestSent || null,
        connected: formData.connected || null,
        callNumber: formData.callNumber || null,
        callStatus: formData.callStatus || null,
        callDate: callDateValue,
        emailDate: emailDateValue,
        linkedinDate: linkedinDateValue
      };

      let successCount = 0;

      if (isBulk) {
        const contactIds = Array.from(selectedContacts);
        for (const cId of contactIds) {
          const contact = contacts.find(c => c._id === cId);
          if (!contact) continue;
          
          await API.post('/activities', {
            projectId,
            contactId: cId,
            type,
            ...payloadBase,
            phoneNumber: formData.phoneNumber || contact.phoneNumber || null,
            email: formData.email || contact.email || null,
            linkedInUrl: formData.linkedInUrl || contact.linkedInProfileUrl || null,
          });
          
          if (formData.status && projectId) {
            try {
              await API.put(\`/projects/\${projectId}/project-contacts/\${cId}\`, {
                stage: formData.status
              });
            } catch (err) {}
          }
          successCount++;
        }
      } else {
        if (editMode && activityId) {
          await API.put(\`/activities/\${activityId}\`, {
            ...payloadBase,
            phoneNumber: formData.phoneNumber || phoneNumber || null,
            email: formData.email || email || null,
            linkedInUrl: formData.linkedInUrl || linkedInProfileUrl || null,
          });
        } else {
          await API.post('/activities', {
            projectId,
            contactId: contactId || null,
            type,
            ...payloadBase,
            outcome: null,
            phoneNumber: formData.phoneNumber || phoneNumber || null,
            email: formData.email || email || null,
            linkedInUrl: formData.linkedInUrl || linkedInProfileUrl || null,
          });
        }
        
        if (formData.status && contactId && projectId) {
          try {
            await API.put(\`/projects/\${projectId}/project-contacts/\${contactId}\`, {
              stage: formData.status
            });
          } catch (err) {}
        }
        successCount = 1;
      }

      if (successCount > 0) {
        window.dispatchEvent(new CustomEvent('activitySaved', {
          detail: {
            type: type,
            projectId: projectId,
            contactId: contactId,
            isBulk
          }
        }));

        setFormData({
          subject: '', templateOption: '', message: '', outcome: '',
          conversationNotes: '', nextAction: '', nextActionDate: '',
          phoneNumber: phoneNumber || '', email: email || '', linkedInUrl: linkedInProfileUrl || '',
          status: '', linkedInAccountName: '', lnRequestSent: '', connected: '',
          callNumber: '', callStatus: '', callDate: '', emailDate: '', linkedinDate: ''
        });
        
        setSuccessMessage('Activity logged successfully!');
        setTimeout(() => {
          setSuccessMessage('');
          onClose();
        }, 1500);
      }
    } catch (error) {
      console.error('Error saving activity:', error);
      setErrors({ submit: error.response?.data?.error || 'Failed to save activity' });
    } finally {
      setLoading(false);
    }
  };

`;

content = content.substring(0, submitStart) + newSubmit + content.substring(submitEnd);

// 3. Fix the title to show bulk
content = content.replace(
  'const getTitle = () => {',
  `const getTitle = () => {
    if (isBulk) {
      switch (type) {
        case 'call': return 'Bulk Log Call Activity';
        case 'email': return 'Bulk Log Email Activity';
        case 'linkedin': return 'Bulk Log LinkedIn Activity';
        default: return 'Bulk Log Activity';
      }
    }`
);

// 4. Update the "Apply to X contacts" text if isBulk
content = content.replace(
  '<div className="w-full">',
  `{isBulk && (
    <div className="mb-4 bg-blue-50 text-blue-700 p-3 rounded-lg flex items-center gap-2">
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      Applying to {selectedContacts.size} selected contacts
    </div>
  )}
  <div className="w-full">`
);

fs.writeFileSync(modalPath, content);
console.log("Refactoring complete");
