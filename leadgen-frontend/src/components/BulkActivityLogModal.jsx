import React from 'react';
import ActivityLogModal from './ActivityLogModal';

export default function BulkActivityLogModal(props) {
  return <ActivityLogModal {...props} isBulk={true} />;
}
