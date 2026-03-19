// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Users, Save, RefreshCw, Plus, Trash, Edit2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import AdminNav from '@/components/AdminNav';

const AdminMentors = () => {
    const [mentors, setMentors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [saveError, setSaveError] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        role: '',
        description: '',
        image_url: ''
    });

    useEffect(() => {
        fetchMentors();
    }, []);

    const fetchMentors = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('mentors').select('*').order('name');
            if (error) throw error;
            setMentors(data || []);
        } catch (err) {
            console.error('Error fetching mentors:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (mentor) => {
        setEditingId(mentor.id);
        setSaveError(null);
        setFormData({
            name: mentor.name,
            role: mentor.role || mentor.specialty || '', // Handle varied schema names
            description: mentor.description || mentor.bio || '',
            image_url: mentor.image_url || ''
        });
    };

    const handleCancel = () => {
        setEditingId(null);
        setSaveError(null);
        setFormData({ name: '', role: '', description: '', image_url: '' });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaveError(null);
        console.log('Starting save...', formData);

        try {
            const payload = {
                name: formData.name,
                role: formData.role,
                description: formData.description,
                image_url: formData.image_url
            };

            let error;
            if (editingId && editingId !== 'new') {
                console.log('Updating mentor:', editingId);
                const { error: updateError } = await supabase
                    .from('mentors')
                    .update(payload)
                    .eq('id', editingId);
                error = updateError;
            } else {
                console.log('Inserting new mentor');
                const { error: insertError } = await supabase
                    .from('mentors')
                    .insert([payload]);
                error = insertError;
            }

            if (error) {
                console.error('Supabase Save Error:', error);
                throw error;
            }

            console.log('Save successful');
            handleCancel();
            fetchMentors();
        } catch (err) {
            console.error('Catch Error saving mentor:', err);
            setSaveError(err.message || err.error_description || JSON.stringify(err));
        }
    };

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('mentors')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('mentors').getPublicUrl(filePath);
            setFormData({ ...formData, image_url: data.publicUrl });
        } catch (err) {
            console.error('Error uploading image:', err.message);
            alert('Error uploading image: ' + err.message);
        }
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            console.log('Executing Supabase Delete for:', deleteId);
            const { error } = await supabase.from('mentors').delete().eq('id', deleteId);

            if (error) {
                console.error('Delete Supabase Error:', error);
                throw error;
            }

            console.log('Delete Success');
            fetchMentors();
        } catch (err) {
            console.error('Catch Error deleting mentor:', err);
            alert(`Error deleting mentor: ${err.message || err.error_description || JSON.stringify(err)}`);
        } finally {
            setDeleteId(null);
        }
    };

    return (
        <>
            <AdminNav />
            <div className="brutal-container py-8">
                <header className="mb-8 border-b-4 border-slate-900 pb-4 flex justify-between items-center">
                    <div>
                        <h1 className="brutal-title text-3xl">Manage Mentors</h1>
                        <p className="font-mono text-slate-500">Add or edit system mentors.</p>
                    </div>
                    {!editingId && (
                        <Button onClick={() => { setEditingId('new'); setSaveError(null); }} className="brutal-btn primary">
                            <Plus className="mr-2 h-4 w-4" /> Add Mentor
                        </Button>
                    )}
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* List */}
                    <div className="space-y-4">
                        {loading ? <p>Loading...</p> : mentors.map(mentor => (
                            <div key={mentor.id} className="brutal-card p-4 flex gap-4 items-start">
                                <img
                                    src={mentor.image_url || '/placeholder.png'}
                                    alt={mentor.name}
                                    className="w-16 h-16 rounded-full border-2 border-slate-900 object-cover"
                                />
                                <div className="flex-1">
                                    <h3 className="font-bold text-lg">{mentor.name}</h3>
                                    <p className="text-sm font-bold text-indigo-600 uppercase">{mentor.role || mentor.specialty}</p>
                                    <p className="text-xs text-slate-600 line-clamp-2 mt-1">{mentor.description || mentor.bio}</p>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => handleEdit(mentor)}>
                                        <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-500 hover:text-red-700 relative z-50 cursor-pointer hover:bg-red-100"
                                        onClick={() => setDeleteId(mentor.id)}
                                    >
                                        <Trash className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                        {!loading && mentors.length === 0 && <p className="text-slate-500 italic">No mentors found.</p>}
                    </div>

                    {/* Editor */}
                    <div>
                        {(editingId || editingId === 'new') && (
                            <Card className="brutal-card sticky top-24">
                                <CardHeader>
                                    <CardTitle>{editingId === 'new' ? 'New Mentor' : 'Edit Mentor'}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleSave} className="space-y-4">
                                        <div>
                                            <label className="brutal-label">Name</label>
                                            <Input
                                                value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                required
                                                className="brutal-input"
                                            />
                                        </div>
                                        <div>
                                            <label className="brutal-label">Role / Specialty</label>
                                            <Input
                                                value={formData.role}
                                                onChange={e => setFormData({ ...formData, role: e.target.value })}
                                                required
                                                className="brutal-input"
                                            />
                                        </div>
                                        <div>
                                            <label className="brutal-label">Image</label>
                                            <div className="flex gap-2 items-center">
                                                {formData.image_url && <img src={formData.image_url} className="w-10 h-10 rounded border" alt="Preview" />}
                                                <Input
                                                    type="file"
                                                    onChange={handleUpload}
                                                    accept="image/*"
                                                    className="brutal-input flex-1"
                                                />
                                            </div>
                                            <Input
                                                value={formData.image_url}
                                                readOnly
                                                className="brutal-input text-xs text-slate-400"
                                            />
                                        </div>
                                        <div>
                                            <label className="brutal-label">Description / Bio</label>
                                            <Textarea
                                                value={formData.description}
                                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                                className="brutal-input"
                                                rows={4}
                                            />
                                        </div>

                                        {saveError && (
                                            <div className="p-3 bg-red-100 border border-red-400 text-red-700 text-sm rounded font-bold">
                                                ERROR: {saveError}
                                            </div>
                                        )}

                                        <div className="flex gap-2 justify-end pt-4">
                                            <Button type="button" variant="outline" onClick={handleCancel}>Cancel</Button>
                                            <Button type="submit" className="brutal-btn primary">Save Mentor</Button>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>

                <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                    <AlertDialogContent className="bg-white text-black border-4 border-slate-900">
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-600">
                                This action cannot be undone. This will permanently delete the mentor from the database.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="bg-slate-100 text-slate-900 border-2 border-slate-200">Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </>
    );
};

export default AdminMentors;
