"use client";
import { useState } from "react";
import { Plus, Trash2, Save, X, Edit, ChevronRight, ChevronDown, Folder, FolderOpen, ExternalLink } from "lucide-react";

type Link = {
  id: string;
  title: string;
  url: string;
  description?: string;
  order: number;
};

type LinkSubSubCategory = {
  id: string;
  name: string;
  description?: string;
  order: number;
  links: Link[];
};

type LinkSubCategory = {
  id: string;
  name: string;
  description?: string;
  order: number;
  links: Link[];
  subSubCategories: LinkSubSubCategory[];
};

type LinkCategory = {
  id: string;
  name: string;
  description?: string;
  order: number;
  links: Link[];
  subCategories: LinkSubCategory[];
};

export function HierarchicalLinksAdmin({ initialCategories }: { initialCategories: LinkCategory[] }) {
  const [categories, setCategories] = useState<LinkCategory[]>(initialCategories || []);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedSubCategories, setExpandedSubCategories] = useState<Set<string>>(new Set());
  
  // Form states
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [addingSubCategoryTo, setAddingSubCategoryTo] = useState<string | null>(null);
  const [addingLinkTo, setAddingLinkTo] = useState<{ type: 'category' | 'subCategory' | 'subSubCategory'; id: string } | null>(null);
  const [editingLink, setEditingLink] = useState<string | null>(null);
  
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newSubCategoryName, setNewSubCategoryName] = useState("");
  const [newLink, setNewLink] = useState({ title: "", url: "", description: "" });
  const [editLink, setEditLink] = useState({ title: "", url: "", description: "" });

  // Toggle functions
  const toggleCategory = (id: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedCategories(newExpanded);
  };

  const toggleSubCategory = (id: string) => {
    const newExpanded = new Set(expandedSubCategories);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedSubCategories(newExpanded);
  };

  // API functions
  const createCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    try {
      const res = await fetch("/api/links/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });
      
      if (res.ok) {
        const newCategory = await res.json();
        setCategories([...categories, { ...newCategory, links: [], subCategories: [] }]);
        setNewCategoryName("");
        setIsAddingCategory(false);
      }
    } catch (error) {
      console.error("Failed to create category:", error);
    }
  };

  const createSubCategory = async (categoryId: string) => {
    if (!newSubCategoryName.trim()) return;
    
    try {
      const res = await fetch("/api/links/subcategories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newSubCategoryName.trim(), categoryId }),
      });
      
      if (res.ok) {
        const newSubCategory = await res.json();
        setCategories(categories.map(cat => 
          cat.id === categoryId 
            ? { ...cat, subCategories: [...cat.subCategories, { ...newSubCategory, links: [], subSubCategories: [] }] }
            : cat
        ));
        setNewSubCategoryName("");
        setAddingSubCategoryTo(null);
      }
    } catch (error) {
      console.error("Failed to create subcategory:", error);
    }
  };

  const createLink = async () => {
    if (!newLink.title.trim() || !newLink.url.trim() || !addingLinkTo) return;
    
    const linkData = {
      title: newLink.title.trim(),
      url: newLink.url.trim(),
      description: newLink.description.trim() || null,
      [`${addingLinkTo.type}Id`]: addingLinkTo.id,
    };
    
    try {
      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(linkData),
      });
      
      if (res.ok) {
        const createdLink = await res.json();
        
        // Update state
        setCategories(categories.map(cat => {
          if (addingLinkTo.type === 'category' && cat.id === addingLinkTo.id) {
            return { ...cat, links: [...cat.links, createdLink] };
          }
          
          return {
            ...cat,
            subCategories: cat.subCategories.map(subCat => {
              if (addingLinkTo.type === 'subCategory' && subCat.id === addingLinkTo.id) {
                return { ...subCat, links: [...subCat.links, createdLink] };
              }
              
              return {
                ...subCat,
                subSubCategories: subCat.subSubCategories.map(subSubCat => 
                  addingLinkTo.type === 'subSubCategory' && subSubCat.id === addingLinkTo.id
                    ? { ...subSubCat, links: [...subSubCat.links, createdLink] }
                    : subSubCat
                )
              };
            })
          };
        }));
        
        setNewLink({ title: "", url: "", description: "" });
        setAddingLinkTo(null);
      }
    } catch (error) {
      console.error("Failed to create link:", error);
    }
  };

  const updateLink = async (linkId: string) => {
    if (!editLink.title.trim() || !editLink.url.trim()) return;
    
    try {
      const res = await fetch(`/api/links/${linkId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editLink.title.trim(),
          url: editLink.url.trim(),
          description: editLink.description.trim() || null,
        }),
      });
      
      if (res.ok) {
        const updatedLink = await res.json();
        
        // Update the link in state
        setCategories(categories.map(cat => ({
          ...cat,
          links: cat.links.map(link => link.id === linkId ? updatedLink : link),
          subCategories: cat.subCategories.map(subCat => ({
            ...subCat,
            links: subCat.links.map(link => link.id === linkId ? updatedLink : link),
            subSubCategories: subCat.subSubCategories.map(subSubCat => ({
              ...subSubCat,
              links: subSubCat.links.map(link => link.id === linkId ? updatedLink : link)
            }))
          }))
        })));
        
        setEditingLink(null);
        setEditLink({ title: "", url: "", description: "" });
      }
    } catch (error) {
      console.error("Failed to update link:", error);
    }
  };

  const deleteLink = async (linkId: string) => {
    if (!confirm("Are you sure you want to delete this link?")) return;
    
    try {
      const res = await fetch(`/api/links/${linkId}`, { method: "DELETE" });
      if (res.ok) {
        // Remove link from state
        setCategories(categories.map(cat => ({
          ...cat,
          links: cat.links.filter(link => link.id !== linkId),
          subCategories: cat.subCategories.map(subCat => ({
            ...subCat,
            links: subCat.links.filter(link => link.id !== linkId),
            subSubCategories: subCat.subSubCategories.map(subSubCat => ({
              ...subSubCat,
              links: subSubCat.links.filter(link => link.id !== linkId)
            }))
          }))
        })));
      }
    } catch (error) {
      console.error("Failed to delete link:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-yellow-100 p-4 rounded">
        <h2 className="font-bold">EDIT VERSION LOADED</h2>
        <p>If you can see this yellow box, the new component is working.</p>
      </div>

      {/* Rest of component... */}
      <div className="card bg-blue-50">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Manage Business Links</h2>
          {!isAddingCategory ? (
            <button 
              onClick={() => setIsAddingCategory(true)} 
              className="bg-blue-600 text-white px-4 py-2 rounded font-medium"
            >
              + Add Main Category
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <input 
                className="input" 
                placeholder="Category name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && createCategory()}
                autoFocus
              />
              <button onClick={createCategory} className="bg-green-600 text-white px-3 py-2 rounded">
                Save
              </button>
              <button onClick={() => { setIsAddingCategory(false); setNewCategoryName(""); }} className="bg-gray-500 text-white px-3 py-2 rounded">
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Categories */}
      {categories.map((category) => {
        const isExpanded = expandedCategories.has(category.id);
        const hasContent = category.links.length > 0 || category.subCategories.length > 0;
        
        return (
          <div key={category.id} className="card">
            {/* Category Header */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => toggleCategory(category.id)}
                className="flex items-center gap-2 text-left hover:bg-gray-50 rounded p-2 -m-2"
              >
                {hasContent ? (
                  isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                  )
                ) : (
                  <div className="w-5 h-5" />
                )}
                <Folder className="w-5 h-5 text-blue-600" />
                <span className="text-xl font-bold text-blue-700">{category.name}</span>
              </button>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setAddingSubCategoryTo(category.id)}
                  className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm"
                >
                  + Add Subfolder
                </button>
                <button 
                  onClick={() => setAddingLinkTo({ type: 'category', id: category.id })}
                  className="bg-green-600 text-white px-3 py-1.5 rounded text-sm"
                >
                  + Add Link Here
                </button>
              </div>
            </div>

            {/* Add SubCategory Form */}
            {addingSubCategoryTo === category.id && (
              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium mb-2">Add Subfolder to "{category.name}"</h4>
                <div className="flex items-center gap-2">
                  <input 
                    className="input flex-1" 
                    placeholder="Subfolder name"
                    value={newSubCategoryName}
                    onChange={(e) => setNewSubCategoryName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && createSubCategory(category.id)}
                    autoFocus
                  />
                  <button onClick={() => createSubCategory(category.id)} className="bg-green-600 text-white px-4 py-2 rounded">
                    Save
                  </button>
                  <button onClick={() => { setAddingSubCategoryTo(null); setNewSubCategoryName(""); }} className="bg-gray-500 text-white px-4 py-2 rounded">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Add Link Form */}
            {addingLinkTo?.type === 'category' && addingLinkTo.id === category.id && (
              <div className="mb-4 p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium mb-2">Add Link to "{category.name}"</h4>
                <div className="space-y-3">
                  <input 
                    className="input w-full" 
                    placeholder="Link title"
                    value={newLink.title}
                    onChange={(e) => setNewLink({...newLink, title: e.target.value})}
                  />
                  <input 
                    className="input w-full" 
                    placeholder="URL"
                    value={newLink.url}
                    onChange={(e) => setNewLink({...newLink, url: e.target.value})}
                  />
                  <input 
                    className="input w-full" 
                    placeholder="Description (optional)"
                    value={newLink.description}
                    onChange={(e) => setNewLink({...newLink, description: e.target.value})}
                  />
                  <div className="flex gap-2">
                    <button onClick={createLink} className="bg-green-600 text-white px-4 py-2 rounded">
                      Save Link
                    </button>
                    <button 
                      onClick={() => { 
                        setAddingLinkTo(null); 
                        setNewLink({ title: "", url: "", description: "" }); 
                      }} 
                      className="bg-gray-500 text-white px-4 py-2 rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Category Content */}
            {isExpanded && (
              <div className="ml-6 space-y-3">
                {/* Category Links */}
                {category.links
                  .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))
                  .map((link) => (
                    <div key={link.id}>
                      {editingLink === link.id ? (
                        <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-300">
                          <h4 className="font-medium mb-2 text-blue-700">Edit Link</h4>
                          <div className="space-y-2">
                            <input 
                              className="input w-full" 
                              value={editLink.title}
                              onChange={(e) => setEditLink({...editLink, title: e.target.value})}
                              placeholder="Link title"
                            />
                            <input 
                              className="input w-full" 
                              value={editLink.url}
                              onChange={(e) => setEditLink({...editLink, url: e.target.value})}
                              placeholder="URL"
                            />
                            <input 
                              className="input w-full" 
                              value={editLink.description}
                              onChange={(e) => setEditLink({...editLink, description: e.target.value})}
                              placeholder="Description (optional)"
                            />
                            <div className="flex gap-2">
                              <button onClick={() => updateLink(link.id)} className="bg-green-600 text-white px-4 py-2 rounded">
                                Save Changes
                              </button>
                              <button 
                                onClick={() => { 
                                  setEditingLink(null); 
                                  setEditLink({ title: "", url: "", description: "" }); 
                                }} 
                                className="bg-gray-500 text-white px-4 py-2 rounded"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border">
                          <div className="flex items-center gap-2">
                            <ExternalLink className="w-4 h-4 text-blue-600" />
                            <div>
                              <div className="font-medium text-blue-700">{link.title}</div>
                              {link.description && (
                                <div className="text-sm text-gray-600">{link.description}</div>
                              )}
                              <div className="text-xs text-gray-500">{link.url}</div>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button 
                              onClick={() => { 
                                setEditingLink(link.id);
                                setEditLink({ 
                                  title: link.title, 
                                  url: link.url, 
                                  description: link.description || "" 
                                });
                              }}
                              className="bg-blue-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1"
                            >
                              <Edit className="w-3 h-3" /> Edit
                            </button>
                            <button 
                              onClick={() => deleteLink(link.id)}
                              className="bg-red-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" /> Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                {/* SubCategories */}
                {category.subCategories
                  .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
                  .map((subCategory) => {
                    const isSubExpanded = expandedSubCategories.has(subCategory.id);
                    const hasSubContent = subCategory.links.length > 0 || subCategory.subSubCategories.length > 0;
                    
                    return (
                      <div key={subCategory.id} className="border-l-4 border-orange-300 pl-4">
                        {/* SubCategory Header */}
                        <div className="flex items-center justify-between mb-2">
                          <button
                            onClick={() => toggleSubCategory(subCategory.id)}
                            className="flex items-center gap-2 text-left hover:bg-gray-50 rounded p-1 -m-1"
                          >
                            {hasSubContent ? (
                              isSubExpanded ? (
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                              )
                            ) : (
                              <div className="w-4 h-4" />
                            )}
                            <Folder className="w-4 h-4 text-orange-500" />
                            <span className="font-bold text-orange-700">{subCategory.name}</span>
                          </button>
                          
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => setAddingLinkTo({ type: 'subCategory', id: subCategory.id })}
                              className="bg-green-600 text-white px-2 py-1 rounded text-xs"
                            >
                              + Add Link Here
                            </button>
                          </div>
                        </div>

                        {/* Add Link Form for SubCategory */}
                        {addingLinkTo?.type === 'subCategory' && addingLinkTo.id === subCategory.id && (
                          <div className="mb-3 p-4 bg-green-50 rounded-lg">
                            <h4 className="font-medium mb-2">Add Link to "{subCategory.name}"</h4>
                            <div className="space-y-2">
                              <input 
                                className="input w-full" 
                                placeholder="Link title"
                                value={newLink.title}
                                onChange={(e) => setNewLink({...newLink, title: e.target.value})}
                              />
                              <input 
                                className="input w-full" 
                                placeholder="URL"
                                value={newLink.url}
                                onChange={(e) => setNewLink({...newLink, url: e.target.value})}
                              />
                              <input 
                                className="input w-full" 
                                placeholder="Description (optional)"
                                value={newLink.description}
                                onChange={(e) => setNewLink({...newLink, description: e.target.value})}
                              />
                              <div className="flex gap-2">
                                <button onClick={createLink} className="bg-green-600 text-white px-4 py-2 rounded">
                                  Save Link
                                </button>
                                <button 
                                  onClick={() => { 
                                    setAddingLinkTo(null); 
                                    setNewLink({ title: "", url: "", description: "" }); 
                                  }} 
                                  className="bg-gray-500 text-white px-4 py-2 rounded"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* SubCategory Links */}
                        {isSubExpanded && (
                          <div className="ml-6 space-y-2">
                            {subCategory.links
                              .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))
                              .map((link) => (
                                <div key={link.id}>
                                  {editingLink === link.id ? (
                                    <div className="p-3 bg-orange-50 rounded border-2 border-orange-300">
                                      <h4 className="font-medium mb-2 text-orange-700">Edit Link</h4>
                                      <div className="space-y-2">
                                        <input 
                                          className="input w-full" 
                                          value={editLink.title}
                                          onChange={(e) => setEditLink({...editLink, title: e.target.value})}
                                          placeholder="Link title"
                                        />
                                        <input 
                                          className="input w-full" 
                                          value={editLink.url}
                                          onChange={(e) => setEditLink({...editLink, url: e.target.value})}
                                          placeholder="URL"
                                        />
                                        <input 
                                          className="input w-full" 
                                          value={editLink.description}
                                          onChange={(e) => setEditLink({...editLink, description: e.target.value})}
                                          placeholder="Description (optional)"
                                        />
                                        <div className="flex gap-2">
                                          <button onClick={() => updateLink(link.id)} className="bg-green-600 text-white px-3 py-1.5 rounded text-xs">
                                            Save Changes
                                          </button>
                                          <button 
                                            onClick={() => { 
                                              setEditingLink(null); 
                                              setEditLink({ title: "", url: "", description: "" }); 
                                            }} 
                                            className="bg-gray-500 text-white px-3 py-1.5 rounded text-xs"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-between p-2 bg-orange-50 rounded border">
                                      <div className="flex items-center gap-2">
                                        <ExternalLink className="w-4 h-4 text-orange-600" />
                                        <div>
                                          <div className="font-medium text-orange-700">{link.title}</div>
                                          {link.description && (
                                            <div className="text-sm text-gray-600">{link.description}</div>
                                          )}
                                          <div className="text-xs text-gray-500">{link.url}</div>
                                        </div>
                                      </div>
                                      <div className="flex gap-1">
                                        <button 
                                          onClick={() => { 
                                            setEditingLink(link.id);
                                            setEditLink({ 
                                              title: link.title, 
                                              url: link.url, 
                                              description: link.description || "" 
                                            });
                                          }}
                                          className="bg-orange-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1"
                                        >
                                          <Edit className="w-3 h-3" /> Edit
                                        </button>
                                        <button 
                                          onClick={() => deleteLink(link.id)}
                                          className="bg-red-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1"
                                        >
                                          <Trash2 className="w-3 h-3" /> Delete
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            {/* Sub-Sub Categories */}
                            {subCategory.subSubCategories
                              .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
                              .map((subSubCategory) => (
                                <div key={subSubCategory.id} className="border-l-4 border-green-300 pl-4 mt-3">
                                  {/* Sub-Sub Category Header */}
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <Folder className="w-4 h-4 text-green-500" />
                                      <span className="font-bold text-green-700">{subSubCategory.name}</span>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                      <button 
                                        onClick={() => setAddingLinkTo({ type: 'subSubCategory', id: subSubCategory.id })}
                                        className="bg-green-600 text-white px-2 py-1 rounded text-xs"
                                      >
                                        + Add Link Here
                                      </button>
                                      {/* Delete SubSubCategory Button - only if empty */}
                                      {subSubCategory.links.length === 0 && (
                                        <button 
                                          onClick={() => deleteSubSubCategory(subSubCategory.id)}
                                          className="bg-red-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1"
                                        >
                                          <Trash2 className="w-3 h-3" /> Delete Empty
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {/* Add Link Form for SubSubCategory */}
                                  {addingLinkTo?.type === 'subSubCategory' && addingLinkTo.id === subSubCategory.id && (
                                    <div className="mb-3 p-4 bg-green-50 rounded-lg">
                                      <h4 className="font-medium mb-2">Add Link to "{subSubCategory.name}"</h4>
                                      <div className="space-y-2">
                                        <input 
                                          className="input w-full" 
                                          placeholder="Link title"
                                          value={newLink.title}
                                          onChange={(e) => setNewLink({...newLink, title: e.target.value})}
                                        />
                                        <input 
                                          className="input w-full" 
                                          placeholder="URL"
                                          value={newLink.url}
                                          onChange={(e) => setNewLink({...newLink, url: e.target.value})}
                                        />
                                        <input 
                                          className="input w-full" 
                                          placeholder="Description (optional)"
                                          value={newLink.description}
                                          onChange={(e) => setNewLink({...newLink, description: e.target.value})}
                                        />
                                        <div className="flex gap-2">
                                          <button onClick={createLink} className="bg-green-600 text-white px-4 py-2 rounded">
                                            Save Link
                                          </button>
                                          <button 
                                            onClick={() => { 
                                              setAddingLinkTo(null); 
                                              setNewLink({ title: "", url: "", description: "" }); 
                                            }} 
                                            className="bg-gray-500 text-white px-4 py-2 rounded"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Links in SubSubCategory */}
                                  {subSubCategory.links
                                    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))
                                    .map((link) => (
                                      <div key={link.id} className="mt-2">
                                        {editingLink === link.id ? (
                                          <div className="p-3 bg-green-50 rounded border-2 border-green-300">
                                            <h4 className="font-medium mb-2 text-green-700">Edit Link</h4>
                                            <div className="space-y-2">
                                              <input 
                                                className="input w-full" 
                                                value={editLink.title}
                                                onChange={(e) => setEditLink({...editLink, title: e.target.value})}
                                                placeholder="Link title"
                                              />
                                              <input 
                                                className="input w-full" 
                                                value={editLink.url}
                                                onChange={(e) => setEditLink({...editLink, url: e.target.value})}
                                                placeholder="URL"
                                              />
                                              <input 
                                                className="input w-full" 
                                                value={editLink.description}
                                                onChange={(e) => setEditLink({...editLink, description: e.target.value})}
                                                placeholder="Description (optional)"
                                              />
                                              <div className="flex gap-2">
                                                <button onClick={() => updateLink(link.id)} className="bg-green-600 text-white px-3 py-1.5 rounded text-xs">
                                                  Save Changes
                                                </button>
                                                <button 
                                                  onClick={() => { 
                                                    setEditingLink(null); 
                                                    setEditLink({ title: "", url: "", description: "" }); 
                                                  }} 
                                                  className="bg-gray-500 text-white px-3 py-1.5 rounded text-xs"
                                                >
                                                  Cancel
                                                </button>
                                              </div>
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="flex items-center justify-between p-2 bg-green-50 rounded border">
                                            <div className="flex items-center gap-2">
                                              <ExternalLink className="w-4 h-4 text-green-600" />
                                              <div>
                                                <div className="font-medium text-green-700">{link.title}</div>
                                                {link.description && (
                                                  <div className="text-sm text-gray-600">{link.description}</div>
                                                )}
                                                <div className="text-xs text-gray-500">{link.url}</div>
                                              </div>
                                            </div>
                                            <div className="flex gap-1">
                                              <button 
                                                onClick={() => { 
                                                  setEditingLink(link.id);
                                                  setEditLink({ 
                                                    title: link.title, 
                                                    url: link.url, 
                                                    description: link.description || "" 
                                                  });
                                                }}
                                                className="bg-green-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1"
                                              >
                                                <Edit className="w-3 h-3" /> Edit
                                              </button>
                                              <button 
                                                onClick={() => deleteLink(link.id)}
                                                className="bg-red-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1"
                                              >
                                                <Trash2 className="w-3 h-3" /> Delete
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        );
      })}

      {!categories.length && (
        <div className="card text-center py-8">
          <Folder className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-500 mb-2">No Categories Yet</h3>
          <p className="text-gray-400">Click "Add Main Category" to get started.</p>
        </div>
      )}
    </div>
  );
}