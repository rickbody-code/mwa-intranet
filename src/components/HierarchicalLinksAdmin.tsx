"use client";
import { useState, useEffect } from "react";

type Link = {
  id: string;
  title: string;
  url: string;
  description?: string;
  subSubCategoryId?: string;
};

type LinkSubSubCategory = {
  id: string;
  name: string;
  order: number;
  links: Link[];
};

type LinkSubCategory = {
  id: string;
  name: string;
  order: number;
  links: Link[];
  subSubCategories: LinkSubSubCategory[];
};

type LinkCategory = {
  id: string;
  name: string;
  order: number;
  links: Link[];
  subCategories: LinkSubCategory[];
};

export function HierarchicalLinksAdmin({ initialData }: { initialData: LinkCategory[] }) {
  const [data, setData] = useState<LinkCategory[]>(initialData || []);
  
  // Form states
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [addingSubCategoryTo, setAddingSubCategoryTo] = useState<string | null>(null);
  const [addingSubSubCategoryTo, setAddingSubSubCategoryTo] = useState<string | null>(null);
  const [addingLinkTo, setAddingLinkTo] = useState<{ type: string; id: string } | null>(null);
  
  // Edit states
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingSubCategory, setEditingSubCategory] = useState<string | null>(null);
  const [editingSubSubCategory, setEditingSubSubCategory] = useState<string | null>(null);
  const [editingLink, setEditingLink] = useState<string | null>(null);
  
  // Form inputs
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newSubCategoryName, setNewSubCategoryName] = useState("");
  const [newSubSubCategoryName, setNewSubSubCategoryName] = useState("");
  const [newLinkTitle, setNewLinkTitle] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [newLinkDescription, setNewLinkDescription] = useState("");
  
  // Edit form inputs
  const [editName, setEditName] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editDescription, setEditDescription] = useState("");

  useEffect(() => {
    setData(initialData || []);
  }, [initialData]);

  // CREATE FUNCTIONS
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
        setData([...data, { ...newCategory, links: [], subCategories: [] }]);
        setNewCategoryName("");
        setIsAddingCategory(false);
      }
    } catch (error) {
      console.error("Error creating category:", error);
    }
  };

  const createSubCategory = async (categoryId: string) => {
    if (!newSubCategoryName.trim()) return;
    
    try {
      const res = await fetch("/api/links/subcategories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: newSubCategoryName.trim(),
          categoryId 
        }),
      });
      
      if (res.ok) {
        const newSubCategory = await res.json();
        setData(data.map(cat => 
          cat.id === categoryId 
            ? { ...cat, subCategories: [...cat.subCategories, { ...newSubCategory, links: [], subSubCategories: [] }] }
            : cat
        ));
        setNewSubCategoryName("");
        setAddingSubCategoryTo(null);
      }
    } catch (error) {
      console.error("Error creating subcategory:", error);
    }
  };

  const createSubSubCategory = async (subCategoryId: string) => {
    if (!newSubSubCategoryName.trim()) return;
    
    try {
      const res = await fetch("/api/links/subsubcategories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: newSubSubCategoryName.trim(),
          subCategoryId 
        }),
      });
      
      if (res.ok) {
        const newSubSubCategory = await res.json();
        setData(data.map(cat => ({
          ...cat,
          subCategories: cat.subCategories.map(subCat =>
            subCat.id === subCategoryId
              ? { ...subCat, subSubCategories: [...subCat.subSubCategories, { ...newSubSubCategory, links: [] }] }
              : subCat
          )
        })));
        setNewSubSubCategoryName("");
        setAddingSubSubCategoryTo(null);
      }
    } catch (error) {
      console.error("Error creating sub-subcategory:", error);
    }
  };

  const createLink = async () => {
    if (!newLinkTitle.trim() || !newLinkUrl.trim() || !addingLinkTo) return;
    
    try {
      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title: newLinkTitle.trim(),
          url: newLinkUrl.trim(),
          description: newLinkDescription.trim(),
          [addingLinkTo.type]: addingLinkTo.id
        }),
      });
      
      if (res.ok) {
        const newLink = await res.json();
        setData(data.map(cat => {
          if (addingLinkTo.type === "categoryId" && cat.id === addingLinkTo.id) {
            return { ...cat, links: [...cat.links, newLink] };
          }
          return {
            ...cat,
            subCategories: cat.subCategories.map(subCat => {
              if (addingLinkTo.type === "subCategoryId" && subCat.id === addingLinkTo.id) {
                return { ...subCat, links: [...subCat.links, newLink] };
              }
              return {
                ...subCat,
                subSubCategories: subCat.subSubCategories.map(subSubCat =>
                  addingLinkTo.type === "subSubCategoryId" && subSubCat.id === addingLinkTo.id
                    ? { ...subSubCat, links: [...subSubCat.links, newLink] }
                    : subSubCat
                )
              };
            })
          };
        }));
        setNewLinkTitle("");
        setNewLinkUrl("");
        setNewLinkDescription("");
        setAddingLinkTo(null);
      }
    } catch (error) {
      console.error("Error creating link:", error);
    }
  };

  // EDIT FUNCTIONS
  const startEditCategory = (category: LinkCategory) => {
    setEditingCategory(category.id);
    setEditName(category.name);
  };

  const startEditSubCategory = (subCategory: LinkSubCategory) => {
    setEditingSubCategory(subCategory.id);
    setEditName(subCategory.name);
  };

  const startEditSubSubCategory = (subSubCategory: LinkSubSubCategory) => {
    setEditingSubSubCategory(subSubCategory.id);
    setEditName(subSubCategory.name);
  };

  const startEditLink = (link: Link) => {
    setEditingLink(link.id);
    setEditTitle(link.title);
    setEditUrl(link.url);
    setEditDescription(link.description || "");
  };

  const saveEditCategory = async (categoryId: string) => {
    if (!editName.trim()) return;
    
    try {
      const res = await fetch(`/api/links/categories/${categoryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      });
      
      if (res.ok) {
        setData(data.map(cat => 
          cat.id === categoryId ? { ...cat, name: editName.trim() } : cat
        ));
        setEditingCategory(null);
        setEditName("");
      }
    } catch (error) {
      console.error("Error updating category:", error);
    }
  };

  const saveEditSubCategory = async (subCategoryId: string) => {
    if (!editName.trim()) return;
    
    try {
      const res = await fetch(`/api/links/subcategories/${subCategoryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      });
      
      if (res.ok) {
        setData(data.map(cat => ({
          ...cat,
          subCategories: cat.subCategories.map(subCat =>
            subCat.id === subCategoryId ? { ...subCat, name: editName.trim() } : subCat
          )
        })));
        setEditingSubCategory(null);
        setEditName("");
      }
    } catch (error) {
      console.error("Error updating subcategory:", error);
    }
  };

  const saveEditSubSubCategory = async (subSubCategoryId: string) => {
    if (!editName.trim()) return;
    
    try {
      const res = await fetch(`/api/links/subsubcategories/${subSubCategoryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      });
      
      if (res.ok) {
        setData(data.map(cat => ({
          ...cat,
          subCategories: cat.subCategories.map(subCat => ({
            ...subCat,
            subSubCategories: subCat.subSubCategories.map(subSubCat =>
              subSubCat.id === subSubCategoryId ? { ...subSubCat, name: editName.trim() } : subSubCat
            )
          }))
        })));
        setEditingSubSubCategory(null);
        setEditName("");
      }
    } catch (error) {
      console.error("Error updating sub-subcategory:", error);
    }
  };

  const saveEditLink = async (linkId: string) => {
    if (!editTitle.trim() || !editUrl.trim()) return;
    
    try {
      const res = await fetch(`/api/links/${linkId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title: editTitle.trim(),
          url: editUrl.trim(),
          description: editDescription.trim() 
        }),
      });
      
      if (res.ok) {
        setData(data.map(cat => ({
          ...cat,
          links: cat.links.map(link => 
            link.id === linkId ? { ...link, title: editTitle.trim(), url: editUrl.trim(), description: editDescription.trim() } : link
          ),
          subCategories: cat.subCategories.map(subCat => ({
            ...subCat,
            links: subCat.links.map(link => 
              link.id === linkId ? { ...link, title: editTitle.trim(), url: editUrl.trim(), description: editDescription.trim() } : link
            ),
            subSubCategories: subCat.subSubCategories.map(subSubCat => ({
              ...subSubCat,
              links: subSubCat.links.map(link => 
                link.id === linkId ? { ...link, title: editTitle.trim(), url: editUrl.trim(), description: editDescription.trim() } : link
              )
            }))
          }))
        })));
        setEditingLink(null);
        setEditTitle("");
        setEditUrl("");
        setEditDescription("");
      }
    } catch (error) {
      console.error("Error updating link:", error);
    }
  };

  // DELETE FUNCTIONS
  const deleteCategory = async (categoryId: string) => {
    try {
      const res = await fetch(`/api/links/categories/${categoryId}`, {
        method: "DELETE",
      });
      
      if (res.ok) {
        setData(data.filter(cat => cat.id !== categoryId));
      } else {
        const error = await res.json();
        alert(error.error || "Failed to delete category");
      }
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  const deleteSubCategory = async (subCategoryId: string) => {
    try {
      const res = await fetch(`/api/links/subcategories/${subCategoryId}`, {
        method: "DELETE",
      });
      
      if (res.ok) {
        setData(data.map(cat => ({
          ...cat,
          subCategories: cat.subCategories.filter(subCat => subCat.id !== subCategoryId)
        })));
      } else {
        const error = await res.json();
        alert(error.error || "Failed to delete subcategory");
      }
    } catch (error) {
      console.error("Error deleting subcategory:", error);
    }
  };

  const deleteSubSubCategory = async (subSubCategoryId: string) => {
    try {
      const res = await fetch(`/api/links/subsubcategories/${subSubCategoryId}`, {
        method: "DELETE",
      });
      
      if (res.ok) {
        setData(data.map(cat => ({
          ...cat,
          subCategories: cat.subCategories.map(subCat => ({
            ...subCat,
            subSubCategories: subCat.subSubCategories.filter(subSubCat => subSubCat.id !== subSubCategoryId)
          }))
        })));
      } else {
        const error = await res.json();
        alert(error.error || "Failed to delete sub-subcategory");
      }
    } catch (error) {
      console.error("Error deleting sub-subcategory:", error);
    }
  };

  const deleteLink = async (linkId: string) => {
    try {
      const res = await fetch(`/api/links/${linkId}`, {
        method: "DELETE",
      });
      
      if (res.ok) {
        setData(data.map(cat => ({
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
      console.error("Error deleting link:", error);
    }
  };

  // HELPER FUNCTIONS
  const isCategoryEmpty = (category: LinkCategory) => {
    return category.links.length === 0 && 
           category.subCategories.every(sub => isSubCategoryEmpty(sub));
  };

  const isSubCategoryEmpty = (subCategory: LinkSubCategory) => {
    return subCategory.links.length === 0 && 
           subCategory.subSubCategories.every(subsub => subsub.links.length === 0);
  };

  const isSubSubCategoryEmpty = (subSubCategory: LinkSubSubCategory) => {
    return subSubCategory.links.length === 0;
  };

  return (
    <div className="space-y-6">
      {/* Add Category Form */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <button 
            onClick={() => setIsAddingCategory(true)}
            className="bg-green-600 text-white px-4 py-2 rounded font-medium"
          >
            + Add New Category
          </button>
        </div>
        
        {isAddingCategory && (
          <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <h3 className="font-medium mb-2">New Category</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Category name..."
                className="flex-1 px-3 py-2 border rounded"
              />
              <button 
                onClick={createCategory}
                className="bg-green-600 text-white px-4 py-2 rounded"
                disabled={!newCategoryName.trim()}
              >
                Save
              </button>
              <button 
                onClick={() => {
                  setIsAddingCategory(false);
                  setNewCategoryName("");
                }}
                className="bg-gray-400 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Categories Display */}
      {data.map((category) => (
        <div key={category.id} className="border-2 border-gray-300 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {editingCategory === category.id ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="px-3 py-1 border rounded font-medium text-lg"
                  />
                  <button 
                    onClick={() => saveEditCategory(category.id)}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
                  >
                    Save
                  </button>
                  <button 
                    onClick={() => {
                      setEditingCategory(null);
                      setEditName("");
                    }}
                    className="bg-gray-400 text-white px-3 py-1 rounded text-sm"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-lg font-medium">📁 {category.name}</h2>
                  <button 
                    onClick={() => startEditCategory(category)}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
                  >
                    Edit Name
                  </button>
                  {isCategoryEmpty(category) && (
                    <button 
                      onClick={() => deleteCategory(category.id)}
                      className="bg-red-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Delete Empty
                    </button>
                  )}
                </>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setAddingSubCategoryTo(category.id)}
                className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm"
              >
                + Add Subfolder
              </button>
              <button 
                onClick={() => setAddingLinkTo({ type: "categoryId", id: category.id })}
                className="bg-green-600 text-white px-3 py-1.5 rounded text-sm"
              >
                + Add Link Here
              </button>
            </div>
          </div>

          {/* Add SubCategory Form */}
          {addingSubCategoryTo === category.id && (
            <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
              <h4 className="font-medium mb-2">New Subfolder in "{category.name}"</h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSubCategoryName}
                  onChange={(e) => setNewSubCategoryName(e.target.value)}
                  placeholder="Subfolder name..."
                  className="flex-1 px-3 py-2 border rounded"
                />
                <button 
                  onClick={() => createSubCategory(category.id)}
                  className="bg-blue-600 text-white px-4 py-2 rounded"
                  disabled={!newSubCategoryName.trim()}
                >
                  Save
                </button>
                <button 
                  onClick={() => {
                    setAddingSubCategoryTo(null);
                    setNewSubCategoryName("");
                  }}
                  className="bg-gray-400 text-white px-4 py-2 rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Category Direct Links */}
          {category.links.map((link) => (
            <div key={link.id} className="mb-2 p-3 bg-gray-50 rounded border border-gray-200">
              {editingLink === link.id ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Link title..."
                    className="w-full px-3 py-2 border rounded"
                  />
                  <input
                    type="url"
                    value={editUrl}
                    onChange={(e) => setEditUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border rounded"
                  />
                  <input
                    type="text"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Description (optional)..."
                    className="w-full px-3 py-2 border rounded"
                  />
                  <div className="flex gap-2">
                    <button 
                      onClick={() => saveEditLink(link.id)}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Save
                    </button>
                    <button 
                      onClick={() => {
                        setEditingLink(null);
                        setEditTitle("");
                        setEditUrl("");
                        setEditDescription("");
                      }}
                      className="bg-gray-400 text-white px-3 py-1 rounded text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">🔗 {link.title}</div>
                    <div className="text-sm text-gray-600">{link.url}</div>
                    {link.description && <div className="text-sm text-gray-500">{link.description}</div>}
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => startEditLink(link)}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => deleteLink(link.id)}
                      className="bg-red-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* SubCategories */}
          {category.subCategories
            .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
            .map((subCategory) => (
              <div key={subCategory.id} className="ml-6 mb-4 border-l-4 border-blue-300 pl-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {editingSubCategory === subCategory.id ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="px-3 py-1 border rounded font-medium"
                        />
                        <button 
                          onClick={() => saveEditSubCategory(subCategory.id)}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Save
                        </button>
                        <button 
                          onClick={() => {
                            setEditingSubCategory(null);
                            setEditName("");
                          }}
                          className="bg-gray-400 text-white px-3 py-1 rounded text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <h3 className="font-medium text-blue-800">📂 {subCategory.name}</h3>
                        <button 
                          onClick={() => startEditSubCategory(subCategory)}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Edit Name
                        </button>
                        {isSubCategoryEmpty(subCategory) && (
                          <button 
                            onClick={() => deleteSubCategory(subCategory.id)}
                            className="bg-red-600 text-white px-3 py-1 rounded text-sm"
                          >
                            Delete Empty
                          </button>
                        )}
                      </>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setAddingSubSubCategoryTo(subCategory.id)}
                      className="bg-orange-600 text-white px-3 py-1.5 rounded text-sm"
                    >
                      + Add Sub-Subfolder
                    </button>
                    <button 
                      onClick={() => setAddingLinkTo({ type: "subCategoryId", id: subCategory.id })}
                      className="bg-green-600 text-white px-3 py-1.5 rounded text-sm"
                    >
                      + Add Link Here
                    </button>
                  </div>
                </div>

                {/* Add SubSubCategory Form */}
                {addingSubSubCategoryTo === subCategory.id && (
                  <div className="mb-3 p-3 bg-orange-50 rounded border border-orange-200">
                    <h4 className="font-medium mb-2">New Sub-Subfolder in "{subCategory.name}"</h4>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newSubSubCategoryName}
                        onChange={(e) => setNewSubSubCategoryName(e.target.value)}
                        placeholder="Sub-subfolder name..."
                        className="flex-1 px-3 py-2 border rounded"
                      />
                      <button 
                        onClick={() => createSubSubCategory(subCategory.id)}
                        className="bg-orange-600 text-white px-4 py-2 rounded"
                        disabled={!newSubSubCategoryName.trim()}
                      >
                        Save
                      </button>
                      <button 
                        onClick={() => {
                          setAddingSubSubCategoryTo(null);
                          setNewSubSubCategoryName("");
                        }}
                        className="bg-gray-400 text-white px-4 py-2 rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* SubCategory Direct Links */}
                {subCategory.links.map((link) => (
                  <div key={link.id} className="mb-2 p-3 bg-blue-50 rounded border border-blue-200">
                    {editingLink === link.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          placeholder="Link title..."
                          className="w-full px-3 py-2 border rounded"
                        />
                        <input
                          type="url"
                          value={editUrl}
                          onChange={(e) => setEditUrl(e.target.value)}
                          placeholder="https://..."
                          className="w-full px-3 py-2 border rounded"
                        />
                        <input
                          type="text"
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          placeholder="Description (optional)..."
                          className="w-full px-3 py-2 border rounded"
                        />
                        <div className="flex gap-2">
                          <button 
                            onClick={() => saveEditLink(link.id)}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
                          >
                            Save
                          </button>
                          <button 
                            onClick={() => {
                              setEditingLink(null);
                              setEditTitle("");
                              setEditUrl("");
                              setEditDescription("");
                            }}
                            className="bg-gray-400 text-white px-3 py-1 rounded text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">🔗 {link.title}</div>
                          <div className="text-sm text-gray-600">{link.url}</div>
                          {link.description && <div className="text-sm text-gray-500">{link.description}</div>}
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => startEditLink(link)}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => deleteLink(link.id)}
                            className="bg-red-600 text-white px-3 py-1 rounded text-sm"
                          >
                            Delete
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
                    <div key={subSubCategory.id} className="ml-6 mb-3 border-l-4 border-orange-300 pl-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          {editingSubSubCategory === subSubCategory.id ? (
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="px-3 py-1 border rounded font-medium"
                              />
                              <button 
                                onClick={() => saveEditSubSubCategory(subSubCategory.id)}
                                className="bg-orange-600 text-white px-3 py-1 rounded text-sm"
                              >
                                Save
                              </button>
                              <button 
                                onClick={() => {
                                  setEditingSubSubCategory(null);
                                  setEditName("");
                                }}
                                className="bg-gray-400 text-white px-3 py-1 rounded text-sm"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <>
                              <h4 className="font-medium text-orange-800">📁 {subSubCategory.name}</h4>
                              <button 
                                onClick={() => startEditSubSubCategory(subSubCategory)}
                                className="bg-orange-600 text-white px-3 py-1 rounded text-sm"
                              >
                                Edit Name
                              </button>
                              {isSubSubCategoryEmpty(subSubCategory) && (
                                <button 
                                  onClick={() => deleteSubSubCategory(subSubCategory.id)}
                                  className="bg-red-600 text-white px-3 py-1 rounded text-sm"
                                >
                                  Delete Empty
                                </button>
                              )}
                            </>
                          )}
                        </div>
                        
                        <button 
                          onClick={() => setAddingLinkTo({ type: "subSubCategoryId", id: subSubCategory.id })}
                          className="bg-green-600 text-white px-3 py-1.5 rounded text-sm"
                        >
                          + Add Link Here
                        </button>
                      </div>

                      {/* Sub-SubCategory Links */}
                      {subSubCategory.links.map((link) => (
                        <div key={link.id} className="mb-2 p-3 bg-orange-50 rounded border border-orange-200">
                          {editingLink === link.id ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                placeholder="Link title..."
                                className="w-full px-3 py-2 border rounded"
                              />
                              <input
                                type="url"
                                value={editUrl}
                                onChange={(e) => setEditUrl(e.target.value)}
                                placeholder="https://..."
                                className="w-full px-3 py-2 border rounded"
                              />
                              <input
                                type="text"
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                placeholder="Description (optional)..."
                                className="w-full px-3 py-2 border rounded"
                              />
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => saveEditLink(link.id)}
                                  className="bg-orange-600 text-white px-3 py-1 rounded text-sm"
                                >
                                  Save
                                </button>
                                <button 
                                  onClick={() => {
                                    setEditingLink(null);
                                    setEditTitle("");
                                    setEditUrl("");
                                    setEditDescription("");
                                  }}
                                  className="bg-gray-400 text-white px-3 py-1 rounded text-sm"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">🔗 {link.title}</div>
                                <div className="text-sm text-gray-600">{link.url}</div>
                                {link.description && <div className="text-sm text-gray-500">{link.description}</div>}
                              </div>
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => startEditLink(link)}
                                  className="bg-orange-600 text-white px-3 py-1 rounded text-sm"
                                >
                                  Edit
                                </button>
                                <button 
                                  onClick={() => deleteLink(link.id)}
                                  className="bg-red-600 text-white px-3 py-1 rounded text-sm"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
              </div>
            ))}

          {/* Add Link Form (appears when adding link to any level) */}
          {addingLinkTo && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="font-medium mb-3">Add New Link</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Title *</label>
                  <input
                    type="text"
                    value={newLinkTitle}
                    onChange={(e) => setNewLinkTitle(e.target.value)}
                    placeholder="Link title..."
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">URL *</label>
                  <input
                    type="url"
                    value={newLinkUrl}
                    onChange={(e) => setNewLinkUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <input
                    type="text"
                    value={newLinkDescription}
                    onChange={(e) => setNewLinkDescription(e.target.value)}
                    placeholder="Optional description..."
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={createLink}
                    className="bg-green-600 text-white px-4 py-2 rounded"
                    disabled={!newLinkTitle.trim() || !newLinkUrl.trim()}
                  >
                    Save Link
                  </button>
                  <button 
                    onClick={() => {
                      setAddingLinkTo(null);
                      setNewLinkTitle("");
                      setNewLinkUrl("");
                      setNewLinkDescription("");
                    }}
                    className="bg-gray-400 text-white px-4 py-2 rounded"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}