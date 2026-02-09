'use client';

import { useState, useEffect } from 'react';
import { ProjectCard } from './ProjectCard';
import EditGroupModal from './EditGroupModal';
import { DndContext, DragEndEvent, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { api } from '@/lib/api';

interface Project {
  _id: string;
  name: string;
  displayName: string;
  status: string;
  domain?: string;
  groupId?: string;
  groupName?: string;
  [key: string]: any;
}

interface Group {
  _id: string;
  name: string;
  icon: string;
  color: string;
  description?: string;
}

interface ProjectGroupViewProps {
  projects: Project[];
  groups: Group[];
  onProjectUpdated: () => void;
}

function DraggableProjectCard({ project, onUpdated, groupColor }: { project: Project; onUpdated: () => void; groupColor?: string }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab',
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
    >
      <ProjectCard project={project} onUpdate={onUpdated} headerColor={groupColor} />
    </div>
  );
}

function DroppableGroup({ 
  groupId, 
  children, 
  isOver 
}: { 
  groupId: string; 
  children: React.ReactNode;
  isOver?: boolean;
}) {
  const { setNodeRef } = useDroppable({
    id: groupId,
  });

  return (
    <div 
      ref={setNodeRef}
      className={`transition-all ${isOver ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
    >
      {children}
    </div>
  );
}

export default function ProjectGroupView({ projects, groups, onProjectUpdated }: ProjectGroupViewProps) {
  // Carregar estado de expansão do localStorage (padrão: todos fechados)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('expandedGroups');
      if (saved) {
        try {
          return new Set(JSON.parse(saved));
        } catch {
          return new Set(); // Padrão: todos fechados
        }
      }
    }
    return new Set(); // Padrão: todos fechados
  });
  
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Salvar estado de expansão no localStorage sempre que mudar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('expandedGroups', JSON.stringify(Array.from(expandedGroups)));
    }
  }, [expandedGroups]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Agrupar projetos
  const projectsByGroup = projects.reduce((acc, project) => {
    const groupId = project.groupId || 'ungrouped';
    if (!acc[groupId]) {
      acc[groupId] = [];
    }
    acc[groupId].push(project);
    return acc;
  }, {} as Record<string, Project[]>);

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const handleDragStart = (event: DragEndEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const projectId = active.id as string;
    const targetId = over.id as string;

    // Encontrar o projeto
    const project = projects.find(p => p._id === projectId);
    if (!project) return;

    let newGroupId: string | null = null;
    let newGroupName: string | null = null;

    // Determinar o grupo de destino
    if (targetId === 'ungrouped') {
      newGroupId = null;
      newGroupName = null;
    } else if (targetId.startsWith('group-')) {
      const groupId = targetId.replace('group-', '');
      const group = groups.find(g => g._id === groupId);
      if (group) {
        newGroupId = group._id;
        newGroupName = group.name;
      }
    } else {
      // Se soltou sobre outro projeto, pegar o grupo desse projeto
      const targetProject = projects.find(p => p._id === targetId);
      if (targetProject) {
        newGroupId = targetProject.groupId || null;
        newGroupName = targetProject.groupName || null;
      }
    }

    // Se o grupo mudou, atualizar
    if (newGroupId !== project.groupId) {
      try {
        await api.put(`/projects/${projectId}`, {
          groupId: newGroupId,
          groupName: newGroupName,
        });
        onProjectUpdated();
      } catch (error) {
        console.error('Erro ao mover projeto:', error);
      }
    }
  };

  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    if (!confirm(`Tem certeza que deseja deletar o grupo "${groupName}"?\n\nOs projetos não serão deletados, apenas movidos para "Sem Grupo".`)) {
      return;
    }

    try {
      await api.delete(`/groups/${groupId}`);

      // Atualizar projetos para remover groupId
      const groupProjects = projects.filter(p => p.groupId === groupId);
      await Promise.all(
        groupProjects.map(project =>
          api.put(`/projects/${project._id}`, {
            groupId: null,
            groupName: null,
          })
        )
      );

      onProjectUpdated();
    } catch (error) {
      console.error('Erro ao deletar grupo:', error);
      alert('Erro ao deletar grupo');
    }
  };

  const handleEditGroup = (group: Group) => {
    setEditingGroup(group);
    setShowEditModal(true);
  };
  
  const activeProject = activeId ? projects.find(p => p._id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-4">
        {/* Projetos sem grupo */}
        {projectsByGroup['ungrouped'] && projectsByGroup['ungrouped'].length > 0 && (
          <DroppableGroup groupId="ungrouped">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span>📂 Sem Grupo</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  (Arraste para um grupo abaixo)
                </span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projectsByGroup['ungrouped'].map((project) => (
                  <DraggableProjectCard
                    key={project._id}
                    project={project}
                    onUpdated={onProjectUpdated}
                    groupColor={undefined}
                  />
                ))}
              </div>
            </div>
          </DroppableGroup>
        )}

        {/* Grupos */}
        {groups.map((group) => {
          const groupProjects = projectsByGroup[group._id] || [];
          const isExpanded = expandedGroups.has(group._id);

          return (
            <div 
              key={group._id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
            >
              {/* Header do Grupo */}
              <div
                className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 dark:bg-gray-800 transition-colors"
                style={{ borderLeftColor: group.color, borderLeftWidth: '4px' }}
              >
                <button
                  onClick={() => toggleGroup(group._id)}
                  className="flex items-center gap-3 flex-1 text-left hover:opacity-80 transition"
                >
                  <span className="text-2xl">{group.icon}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {group.name}
                    </h3>
                    {group.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {group.description}
                      </p>
                    )}
                  </div>
                  <span className="ml-2 px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300">
                    {groupProjects.length}
                  </span>
                </button>
                
                <div className="flex items-center gap-2">
                  {/* Botão Editar */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditGroup(group);
                    }}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                    title="Editar grupo"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>

                  {/* Botão Deletar */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteGroup(group._id, group.name);
                    }}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                    title="Deletar grupo"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>

                  {/* Botão Expandir/Colapsar */}
                  <button
                    onClick={() => toggleGroup(group._id)}
                    className="p-2"
                  >
                    <svg
                      className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Projetos do Grupo */}
              {isExpanded && (
                <DroppableGroup groupId={`group-${group._id}`}>
                  <div className="p-6 bg-white dark:bg-gray-900 min-h-[120px]">
                    {groupProjects.length === 0 ? (
                      <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                        <div className="text-4xl mb-2">📦</div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                          Nenhum projeto neste grupo
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          Arraste projetos de "Sem Grupo" para cá
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {groupProjects.map((project) => (
                          <DraggableProjectCard
                            key={project._id}
                            project={project}
                            onUpdated={onProjectUpdated}
                            groupColor={group.color}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </DroppableGroup>
              )}
            </div>
          );
        })}

        {/* Mensagem se não houver grupos */}
        {groups.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
            <div className="text-4xl mb-2">📁</div>
            <p className="text-gray-600 dark:text-gray-400 font-medium">Nenhum grupo criado ainda</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              Clique em "Novo Grupo" no topo da página para criar
            </p>
          </div>
        )}
      </div>

      <DragOverlay>
        {activeProject ? (
          <div className="opacity-90 rotate-3 scale-105">
            <ProjectCard 
              project={activeProject} 
              onUpdate={onProjectUpdated}
              headerColor={activeProject.groupId ? groups.find(g => g._id === activeProject.groupId)?.color : undefined}
            />
          </div>
        ) : null}
      </DragOverlay>

      {/* Edit Group Modal */}
      {showEditModal && editingGroup && (
        <EditGroupModal
          group={editingGroup}
          onClose={() => {
            setShowEditModal(false);
            setEditingGroup(null);
          }}
          onUpdated={() => {
            setShowEditModal(false);
            setEditingGroup(null);
            onProjectUpdated();
          }}
        />
      )}
    </DndContext>
  );
}
