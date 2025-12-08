"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface Course {
    id: string
    title: string
}

interface CourseSelectorProps {
    courses: Course[]
    value: string
    onChange: (value: string) => void
    disabled?: boolean
}

export function CourseSelector({
    courses,
    value,
    onChange,
    disabled
}: CourseSelectorProps) {
    const [open, setOpen] = React.useState(false)
    const selectedCourse = courses.find((course) => course.id === value)

    const formatTitle = (title: string) => {
        // Eliminar el sufijo específico solicitado por el usuario
        let cleanTitle = title.replace(" - Continuidad de Estudios", "")

        // Truncar si es muy largo (fallback por si falla CSS)
        if (cleanTitle.length > 50) {
            cleanTitle = cleanTitle.substring(0, 50) + "..."
        }

        return cleanTitle
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className="w-full justify-between px-3 font-normal"
                >
                    <div className="flex min-w-0 items-center gap-2 flex-1">
                        {value ? (
                            <span className="truncate block" title={selectedCourse?.title}>
                                {selectedCourse ? formatTitle(selectedCourse.title) : ""}
                            </span>
                        ) : (
                            <span className="text-muted-foreground truncate">Selecciona un curso...</span>
                        )}
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Buscar curso..." />
                    <CommandList>
                        <CommandEmpty>No se encontraron cursos.</CommandEmpty>
                        <CommandGroup>
                            {courses.map((course) => (
                                <CommandItem
                                    key={course.id}
                                    value={course.title}
                                    onSelect={() => {
                                        onChange(course.id === value ? "" : course.id)
                                        setOpen(false)
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === course.id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    <span className="truncate" title={course.title}>
                                        {course.title}
                                    </span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
