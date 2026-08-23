import React from 'react';
import { useGroup, type GroupMembership } from '../../context/GroupContext';
import { Button } from '../ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '../ui/dropdown-menu';
import { ChevronsUpDown, Check, Plus, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const GroupSwitcher: React.FC = () => {
  const { activeGroupId, activeGroupRole, myGroups, setActiveGroup } = useGroup();
  const navigate = useNavigate();

  const activeGroup = myGroups.find(g => g.groups.id === activeGroupId)?.groups;

  if (myGroups.length === 0) {
    return (
      <Button variant="outline" className="w-full justify-between mt-2" onClick={() => navigate('/groups')}>
        Select a Group
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-between mt-2 font-normal text-left truncate">
          <div className="truncate">
            {activeGroup ? activeGroup.name : 'Select a Group'}
            <div className="text-[10px] text-muted-foreground uppercase">{activeGroupRole || ''}</div>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        <DropdownMenuLabel>My Groups</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {myGroups.map((membership: GroupMembership) => (
          <DropdownMenuItem 
            key={membership.groups.id}
            onSelect={() => setActiveGroup(membership.groups.id, membership.role)}
            className="flex justify-between"
          >
            <div className="truncate pr-2">
              <div className="font-medium">{membership.groups.name}</div>
              <div className="text-[10px] text-muted-foreground uppercase">{membership.role}</div>
            </div>
            {membership.groups.id === activeGroupId && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate('/groups')}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Manage Groups</span>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navigate('/groups?action=new')}>
          <Plus className="mr-2 h-4 w-4" />
          <span>Create or Join</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
