import { supabaseAdmin } from '../config/supabase';

export class MediaService {
  // Albums
  static async getAlbums(yearId: string, groupId: string) {
    const { data, error } = await supabaseAdmin.from('albums').select('*').eq('festival_year_id', yearId).eq('group_id', groupId).is('deleted_at', null);
    if (error) throw error;
    return data;
  }
  static async createAlbum(data: any, userId: string, groupId: string) {
    const { data: record, error } = await supabaseAdmin.from('albums').insert({ ...data, created_by: userId, group_id: groupId }).select().single();
    if (error) throw error;
    return record;
  }
  static async updateAlbum(id: string, data: any, groupId: string) {
    const { data: record, error } = await supabaseAdmin.from('albums').update({ ...data, updated_at: new Date().toISOString() }).eq('id', id).eq('group_id', groupId).select().single();
    if (error) throw error;
    return record;
  }
  static async deleteAlbum(id: string, groupId: string) {
    const { error } = await supabaseAdmin.from('albums').update({ deleted_at: new Date().toISOString() }).eq('id', id).eq('group_id', groupId);
    if (error) throw error;
  }

  // Gallery Items
  static async getGalleryItems(albumId: string, groupId: string) {
    const { data, error } = await supabaseAdmin.from('gallery_items').select('*').eq('album_id', albumId).eq('group_id', groupId).is('deleted_at', null);
    if (error) throw error;
    return data;
  }
  static async createGalleryItem(data: any, userId: string, groupId: string) {
    const { data: record, error } = await supabaseAdmin.from('gallery_items').insert({ ...data, uploaded_by: userId, group_id: groupId }).select().single();
    if (error) throw error;
    return record;
  }
  static async deleteGalleryItem(id: string, groupId: string) {
    const { error } = await supabaseAdmin.from('gallery_items').update({ deleted_at: new Date().toISOString() }).eq('id', id).eq('group_id', groupId);
    if (error) throw error;
  }

  // Documents
  static async getDocuments(yearId: string, groupId: string) {
    const { data, error } = await supabaseAdmin.from('documents').select('*').eq('festival_year_id', yearId).eq('group_id', groupId).is('deleted_at', null);
    if (error) throw error;
    return data;
  }
  static async createDocument(data: any, userId: string, groupId: string) {
    const { data: record, error } = await supabaseAdmin.from('documents').insert({ ...data, uploaded_by: userId, group_id: groupId }).select().single();
    if (error) throw error;
    return record;
  }
  static async updateDocument(id: string, data: any, groupId: string) {
    const { data: record, error } = await supabaseAdmin.from('documents').update({ ...data, updated_at: new Date().toISOString() }).eq('id', id).eq('group_id', groupId).select().single();
    if (error) throw error;
    return record;
  }
  static async deleteDocument(id: string, groupId: string) {
    const { error } = await supabaseAdmin.from('documents').update({ deleted_at: new Date().toISOString() }).eq('id', id).eq('group_id', groupId);
    if (error) throw error;
  }
}
