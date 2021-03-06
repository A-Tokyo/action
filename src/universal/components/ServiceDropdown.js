// @flow
import React from 'react'
import MenuWithShortcuts from 'universal/components/MenuWithShortcuts'
import MenuItemWithShortcuts from 'universal/components/MenuItemWithShortcuts'
import LoadingComponent from 'universal/components/ErrorComponent/ErrorComponent'
import DropdownMenuItemLabel from 'universal/components/DropdownMenuItemLabel'

type Props = {
  closePortal: () => void,
  handleItemClick: (option: any) => void,
  isLoaded: boolean,
  options: Array<any>
}

const ServiceDropdown = (props: Props) => {
  const {handleItemClick, isLoaded, options, closePortal} = props
  if (!isLoaded) return <LoadingComponent height={100} width={'100%'} />
  return (
    <MenuWithShortcuts ariaLabel={'Select the service to integrate'} closePortal={closePortal}>
      {options.map((option) => {
        return (
          <MenuItemWithShortcuts
            key={option.id}
            label={<DropdownMenuItemLabel>{option.label}</DropdownMenuItemLabel>}
            onClick={() => {
              handleItemClick(option)
            }}
          />
        )
      })}
    </MenuWithShortcuts>
  )
}

export default ServiceDropdown
