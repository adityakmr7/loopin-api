interface MentionEvent {
  field: 'mentions';
  value: {
    comment_id: string;
    media_id: string;
  };
}

/**
 * Handle mention webhook event
 */
export async function handleMentionEvent(
  accountId: string,
  event: MentionEvent
): Promise<void> {
  console.log('📢 Processing mention event:', event.value.comment_id);

  try {
    // TODO: Fetch mention details from Instagram API
    // TODO: Store in database
    // TODO: Trigger automation rules

    console.log('✅ Mention processed');
  } catch (error) {
    console.error('❌ Error processing mention:', error);
    throw error;
  }
}
