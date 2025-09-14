"use client";
import { useState } from "react";
import { ChevronRight, ChevronDown, ExternalLink, Folder, FolderOpen } from "lucide-react";

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

type HierarchicalLinksProps = {
  categories: LinkCategory[];
};

export function HierarchicalLinks({ categories }: HierarchicalLinksProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedSubCategories, setExpandedSubCategories] = useState<Set<string>>(new Set());
  const [expandedSubSubCategories, setExpandedSubSubCategories] = useState<Set<string>>(new Set());

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

  const toggleSubSubCategory = (id: string) => {
    const newExpanded = new Set(expandedSubSubCategories);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedSubSubCategories(newExpanded);
  };

  const sortedCategories = [...categories].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));

  if (!categories.length) {
    return <p className="text-gray-600">No link categories configured yet.</p>;
  }

  return (
    <div className="space-y-2">
      {sortedCategories.map((category) => {
        const isExpanded = expandedCategories.has(category.id);
        const hasContent = category.links.length > 0 || category.subCategories.length > 0;
        
        return (
          <div key={category.id} className="border border-gray-200 rounded-lg">
            {/* Category Header */}
            <button
              onClick={() => toggleCategory(category.id)}
              className="w-full flex items-center gap-2 p-3 text-left hover:bg-gray-50 rounded-lg"
              disabled={!hasContent}
            >
              {hasContent ? (
                isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                )
              ) : (
                <div className="w-4 h-4" />
              )}
              {isExpanded ? (
                <FolderOpen className="w-4 h-4 text-blue-600" />
              ) : (
                <Folder className="w-4 h-4 text-blue-600" />
              )}
              <span className="font-semibold text-gray-900">{category.name}</span>
              {category.description && (
                <span className="text-sm text-gray-500">- {category.description}</span>
              )}
            </button>

            {/* Category Content */}
            {isExpanded && hasContent && (
              <div className="px-6 pb-3 space-y-2">
                {/* Direct links at category level */}
                {category.links
                  .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))
                  .map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 text-sm hover:bg-blue-50 rounded group"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-600" />
                      <span className="text-gray-700 group-hover:text-blue-700">{link.title}</span>
                      {link.description && (
                        <span className="text-xs text-gray-500">- {link.description}</span>
                      )}
                    </a>
                  ))}

                {/* Sub Categories */}
                {category.subCategories
                  .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
                  .map((subCategory) => {
                    const isSubExpanded = expandedSubCategories.has(subCategory.id);
                    const hasSubContent = subCategory.links.length > 0 || subCategory.subSubCategories.length > 0;
                    
                    return (
                      <div key={subCategory.id} className="border-l-2 border-gray-100 ml-2">
                        {/* Sub Category Header */}
                        <button
                          onClick={() => toggleSubCategory(subCategory.id)}
                          className="w-full flex items-center gap-2 p-2 text-left hover:bg-gray-50 rounded"
                          disabled={!hasSubContent}
                        >
                          {hasSubContent ? (
                            isSubExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                            )
                          ) : (
                            <div className="w-3.5 h-3.5" />
                          )}
                          {isSubExpanded ? (
                            <FolderOpen className="w-3.5 h-3.5 text-orange-500" />
                          ) : (
                            <Folder className="w-3.5 h-3.5 text-orange-500" />
                          )}
                          <span className="font-medium text-gray-800">{subCategory.name}</span>
                          {subCategory.description && (
                            <span className="text-xs text-gray-500">- {subCategory.description}</span>
                          )}
                        </button>

                        {/* Sub Category Content */}
                        {isSubExpanded && hasSubContent && (
                          <div className="ml-6 space-y-1">
                            {/* Direct links at subcategory level */}
                            {subCategory.links
                              .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))
                              .map((link) => (
                                <a
                                  key={link.id}
                                  href={link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 p-1.5 text-sm hover:bg-blue-50 rounded group"
                                >
                                  <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-blue-600" />
                                  <span className="text-gray-700 group-hover:text-blue-700">{link.title}</span>
                                  {link.description && (
                                    <span className="text-xs text-gray-500">- {link.description}</span>
                                  )}
                                </a>
                              ))}

                            {/* Sub-Sub Categories */}
                            {subCategory.subSubCategories
                              .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
                              .map((subSubCategory) => {
                                const isSubSubExpanded = expandedSubSubCategories.has(subSubCategory.id);
                                const hasSubSubContent = subSubCategory.links.length > 0;
                                
                                return (
                                  <div key={subSubCategory.id} className="border-l border-gray-100 ml-2">
                                    {/* Sub-Sub Category Header */}
                                    <button
                                      onClick={() => toggleSubSubCategory(subSubCategory.id)}
                                      className="w-full flex items-center gap-2 p-1.5 text-left hover:bg-gray-50 rounded"
                                      disabled={!hasSubSubContent}
                                    >
                                      {hasSubSubContent ? (
                                        isSubSubExpanded ? (
                                          <ChevronDown className="w-3 h-3 text-gray-400" />
                                        ) : (
                                          <ChevronRight className="w-3 h-3 text-gray-400" />
                                        )
                                      ) : (
                                        <div className="w-3 h-3" />
                                      )}
                                      {isSubSubExpanded ? (
                                        <FolderOpen className="w-3 h-3 text-green-500" />
                                      ) : (
                                        <Folder className="w-3 h-3 text-green-500" />
                                      )}
                                      <span className="text-sm font-medium text-gray-700">{subSubCategory.name}</span>
                                    </button>

                                    {/* Sub-Sub Category Content */}
                                    {isSubSubExpanded && hasSubSubContent && (
                                      <div className="ml-5 space-y-1">
                                        {subSubCategory.links
                                          .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))
                                          .map((link) => (
                                            <a
                                              key={link.id}
                                              href={link.url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="flex items-center gap-2 p-1.5 text-sm hover:bg-blue-50 rounded group"
                                            >
                                              <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-blue-600" />
                                              <span className="text-gray-600 group-hover:text-blue-700">{link.title}</span>
                                              {link.description && (
                                                <span className="text-xs text-gray-500">- {link.description}</span>
                                              )}
                                            </a>
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
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}