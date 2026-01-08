'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { FormField, TextareaField } from '@/components/ui/form-field'

const createEventSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  description: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  location: z.string().optional(),
})

type CreateEventFormData = z.infer<typeof createEventSchema>

interface CreateEventFormProps {
  familyId: string
  onSubmit: (data: CreateEventFormData) => Promise<void>
  onCancel?: () => void
}

export function CreateEventForm({ familyId, onSubmit, onCancel }: CreateEventFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateEventFormData>({
    resolver: zodResolver(createEventSchema),
  })

  const handleFormSubmit = async (data: CreateEventFormData) => {
    setIsSubmitting(true)
    try {
      await onSubmit(data)
      reset()
    } catch (error) {
      console.error('Failed to create event:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <FormField
        label="Event Title"
        name="title"
        type="text"
        placeholder="Enter event title"
        required
        error={errors.title}
        {...register('title')}
      />

      <TextareaField
        label="Description"
        name="description"
        placeholder="Describe the event (optional)"
        rows={3}
        {...register('description')}
      />

      <FormField
        label="Date"
        name="date"
        type="date"
        required
        error={errors.date}
        {...register('date')}
      />

      <FormField
        label="Location"
        name="location"
        type="text"
        placeholder="Where will this event take place?"
        {...register('location')}
      />

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Event'}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}
