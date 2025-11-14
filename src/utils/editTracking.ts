import { supabase } from '../config/supabase';

export interface EditHistoryEntry {
  id: string;
  entity_type: 'project' | 'screen' | 'task';
  entity_id: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  edited_by: string;
  edited_at: string;
}

export const trackEdit = async (
  entityType: 'project' | 'screen' | 'task',
  entityId: string,
  fieldName: string,
  oldValue: string | null,
  newValue: string | null,
  userId: string
) => {
  const { error } = await supabase
    .from('edit_history')
    .insert([
      {
        entity_type: entityType,
        entity_id: entityId,
        field_name: fieldName,
        old_value: oldValue,
        new_value: newValue,
        edited_by: userId
      }
    ]);

  if (error) {
    console.error('Error tracking edit:', error);
  }
};

export const getEditHistory = async (
  entityType: 'project' | 'screen' | 'task',
  entityId: string
): Promise<EditHistoryEntry[]> => {
  const { data, error } = await supabase
    .from('edit_history')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('edited_at', { ascending: false });

  if (error) {
    console.error('Error fetching edit history:', error);
    return [];
  }

  return data || [];
};

export const hasBeenEdited = async (
  entityType: 'project' | 'screen' | 'task',
  entityId: string
): Promise<boolean> => {
  const { data, error } = await supabase
    .from('edit_history')
    .select('id')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .limit(1);

  if (error) {
    console.error('Error checking edit status:', error);
    return false;
  }

  return (data?.length || 0) > 0;
};
