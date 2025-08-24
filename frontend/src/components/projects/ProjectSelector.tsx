'use client';

import { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/20/solid';
import { useDashboardStore, useProjects, useSelectedProject } from '@/stores/dashboardStore';
import { ProjectStatusBadge } from './ProjectStatusBadge';
import clsx from 'clsx';

export function ProjectSelector() {
  const projects = useProjects();
  const selectedProject = useSelectedProject();
  const { setSelectedProject } = useDashboardStore();

  if (projects.length === 0) {
    return (
      <div className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-500">
        No projects available
      </div>
    );
  }

  return (
    <Listbox 
      value={selectedProject?.id || ''} 
      onChange={(projectId: string) => setSelectedProject(projectId)}
    >
      <div className="relative">
        <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-white py-3 pl-3 pr-10 text-left border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          {selectedProject ? (
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {selectedProject.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {selectedProject.description}
                </p>
              </div>
              <div className="ml-2 flex-shrink-0">
                <ProjectStatusBadge status={selectedProject.status} size="sm" />
              </div>
            </div>
          ) : (
            <span className="block truncate text-gray-500">Select a project</span>
          )}
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronUpDownIcon
              className="h-5 w-5 text-gray-400"
              aria-hidden="true"
            />
          </span>
        </Listbox.Button>
        
        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
            {projects.map((project) => (
              <Listbox.Option
                key={project.id}
                className={({ active }) =>
                  clsx(
                    'relative cursor-pointer select-none py-3 pl-10 pr-4',
                    active ? 'bg-blue-50 text-blue-900' : 'text-gray-900'
                  )
                }
                value={project.id}
              >
                {({ selected, active }) => (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className={clsx(
                          'text-sm font-medium truncate',
                          selected ? 'font-semibold' : 'font-medium'
                        )}>
                          {project.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {project.description}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <ProjectStatusBadge status={project.status} size="xs" />
                          <span className="text-xs text-gray-400">
                            {project.progress}% complete
                          </span>
                        </div>
                      </div>
                    </div>
                    {selected ? (
                      <span className={clsx(
                        'absolute inset-y-0 left-0 flex items-center pl-3',
                        active ? 'text-blue-600' : 'text-blue-600'
                      )}>
                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                      </span>
                    ) : null}
                  </>
                )}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </Transition>
      </div>
    </Listbox>
  );
}