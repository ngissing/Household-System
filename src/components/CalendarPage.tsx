import React, { useState, useEffect } from 'react';
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Checkbox } from "./ui/checkbox";
import { ChevronDown, ChevronUp } from "lucide-react"; // For collapsible trigger
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { initGoogleCalendar, listCalendars, getCalendarEvents, createEvent } from '@/lib/google-calendar';

interface CalendarItem {
  id: string;
  summary: string;
  primary?: boolean;
}

interface EventItem {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
}

export default function CalendarPage() {
  const [calendars, setCalendars] = useState<CalendarItem[]>([]);
  const [selectedCalendars, setSelectedCalendars] = useState<string[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [viewType, setViewType] = useState<'week' | '4day'>('4day'); // Default to 4day view
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGoogleApiReady, setIsGoogleApiReady] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); // For collapsible section

  useEffect(() => {
    const initialize = async () => {
      try {
        await initGoogleCalendar();
        setIsGoogleApiReady(true);
      } catch (err) {
        console.error("Error initializing Google Calendar API:", err);
        setError("Failed to initialize Google Calendar. Please try refreshing. Ensure you are connected in Settings.");
      }
    };
    initialize();
  }, []);


  useEffect(() => {
    if (!isGoogleApiReady) return;

    const fetchUserCalendars = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const fetchedCalendars = await listCalendars();
        setCalendars(fetchedCalendars || []);
        if (fetchedCalendars && fetchedCalendars.length > 0) {
          const targetCalendar = fetchedCalendars.find(cal => cal.summary === "Allira + Nick");
          const primaryCalendar = fetchedCalendars.find(cal => cal.primary);
          if (targetCalendar && targetCalendar.id) {
            setSelectedCalendars([targetCalendar.id]);
          } else if (primaryCalendar && primaryCalendar.id) {
            setSelectedCalendars([primaryCalendar.id]);
          } else if (fetchedCalendars[0] && fetchedCalendars[0].id) {
            setSelectedCalendars([fetchedCalendars[0].id]);
          } else {
            setSelectedCalendars([]);
          }
        }
      } catch (err) {
        console.error("Error fetching calendars:", err);
        setError("Failed to load calendars. Please ensure you are connected to Google Calendar in Settings.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserCalendars();
  }, [isGoogleApiReady]);

  useEffect(() => {
    if (selectedCalendars.length === 0 || !isGoogleApiReady) {
      setEvents([]);
      return;
    }
    const fetchCalendarEvents = async () => {
      setIsLoadingEvents(true);
      setError(null);
      try {
        const now = new Date();
        const timeMin = new Date(now);
        const timeMax = new Date(now);

        if (viewType === 'week') {
          timeMin.setDate(now.getDate() - now.getDay()); // Start of current week (Sunday)
          timeMax.setDate(timeMin.getDate() + 7);
        } else { // 4day
          timeMax.setDate(now.getDate() + 4);
        }
        timeMin.setHours(0, 0, 0, 0);
        timeMax.setHours(23, 59, 59, 999);

        const fetchedEvents = await getCalendarEvents(selectedCalendars, timeMin, timeMax);
        setEvents(fetchedEvents || []);
      } catch (err) {
        console.error("Error fetching events:", err);
        setError("Failed to load events.");
      } finally {
        setIsLoadingEvents(false);
      }
    };
    fetchCalendarEvents();
  }, [selectedCalendars, viewType, isGoogleApiReady]);

  const handleCalendarSelectionChange = (calendarId: string) => {
    setSelectedCalendars(prev =>
      prev.includes(calendarId)
        ? prev.filter(id => id !== calendarId)
        : [...prev, calendarId]
    );
  };

  const handleAddEvent = async () => {
    if (!isGoogleApiReady || selectedCalendars.length === 0) {
      setError("Please select a calendar and ensure Google API is ready.");
      return;
    }
    // TODO: Implement a proper dialog for event details
    const summary = prompt("Enter event summary:");
    if (!summary) return;

    const startDateTimeStr = prompt("Enter start date/time (YYYY-MM-DDTHH:mm:ss) or (YYYY-MM-DD for all-day):");
    if (!startDateTimeStr) return;

    const endDateTimeStr = prompt("Enter end date/time (YYYY-MM-DDTHH:mm:ss) or (YYYY-MM-DD for all-day, optional if same as start for all-day):", startDateTimeStr);


    const newEvent: any = { summary };

    if (startDateTimeStr.includes('T')) {
        newEvent.start = { dateTime: new Date(startDateTimeStr).toISOString() };
        newEvent.end = { dateTime: new Date(endDateTimeStr || startDateTimeStr).toISOString() };
    } else {
        newEvent.start = { date: startDateTimeStr };
        newEvent.end = { date: endDateTimeStr || startDateTimeStr };
         // For all-day events, Google Calendar API expects the end date to be exclusive.
        // If it's a single all-day event, the end date should be the day after the start date.
        if (newEvent.start.date === newEvent.end.date) {
            const endDate = new Date(newEvent.start.date);
            endDate.setDate(endDate.getDate() + 1);
            newEvent.end.date = endDate.toISOString().split('T')[0];
        }
    }


    try {
      setIsLoadingEvents(true);
      await createEvent(selectedCalendars[0], newEvent); // Add to the first selected calendar
      // Re-fetch events
      const now = new Date();
      const timeMin = new Date(now);
      const timeMax = new Date(now);
      if (viewType === 'week') {
        timeMin.setDate(now.getDate() - now.getDay());
        timeMax.setDate(timeMin.getDate() + 7);
      } else {
        timeMax.setDate(now.getDate() + 4);
      }
      timeMin.setHours(0,0,0,0);
      timeMax.setHours(23,59,59,999);
      const fetchedEvents = await getCalendarEvents(selectedCalendars, timeMin, timeMax);
      setEvents(fetchedEvents || []);
    } catch (err) {
      console.error("Error adding event:", err);
      setError("Failed to add event.");
    } finally {
      setIsLoadingEvents(false);
    }
  };

  const renderCalendarGrid = () => {
    const START_HOUR = 6; // Start displaying from 6 AM
    const END_HOUR = 24;   // Go up to midnight (exclusive for display, so 23:xx is last)
    const VISIBLE_HOURS = END_HOUR - START_HOUR;
    const HOUR_SLOT_HEIGHT_REM = 3; // Corresponds to h-12 if 1rem = 16px, 3rem = 48px
    const MINUTES_IN_HOUR = 60;

    const days = viewType === 'week' ? 7 : 4;
    const startDate = new Date();
    if (viewType === 'week') {
        startDate.setDate(startDate.getDate() - startDate.getDay()); // Start of current week (Sunday)
    }
    startDate.setHours(0,0,0,0); // Ensure it's the very start of the day for date calculations

    const dayColumns = Array.from({ length: days }, (_, i) => {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);

      return (
        <div key={i} className="border-r border-gray-200 p-0 flex-1 min-w-[120px] relative">
          <h4 className="font-semibold text-sm mb-0 sticky top-0 bg-white z-30 p-2 border-b"> {/* z-30 for header */}
            {currentDate.toLocaleDateString(undefined, { weekday: 'short', month: 'numeric', day: 'numeric' })}
          </h4>
          {/* This div will contain the absolutely positioned events for this day */}
          <div className="relative" style={{ height: `${VISIBLE_HOURS * HOUR_SLOT_HEIGHT_REM}rem` }}>
            {events
              .filter(event => {
                const eventStartObj = event.start.dateTime ? new Date(event.start.dateTime) : new Date(event.start.date + 'T00:00:00Z');
                const eventEndObj = event.end.dateTime ? new Date(event.end.dateTime) : new Date(event.start.date + 'T23:59:59Z'); // All-day ends at end of day

                if (event.start.date && event.end.date === event.start.date) { // Single all-day event
                    eventEndObj.setDate(new Date(event.start.date + 'T00:00:00Z').getDate() + 1);
                }
                
                const currentDayStart = new Date(currentDate); // Local 00:00
                const currentDayEnd = new Date(currentDate);
                currentDayEnd.setDate(currentDayEnd.getDate() + 1); // Next day 00:00 local

                // Filter out events that are entirely outside the visible time range for the day
                const eventLocalEndHour = eventEndObj.getHours() + eventEndObj.getMinutes() / MINUTES_IN_HOUR;
                const eventLocalStartHour = eventStartObj.getHours() + eventStartObj.getMinutes() / MINUTES_IN_HOUR;

                if (eventEndObj <= currentDayStart || eventStartObj >= currentDayEnd) return false; // Not on this day at all
                if (eventLocalEndHour <= START_HOUR && eventStartObj.getDate() === currentDate.getDate()) return false; // Ends before visible part of this day
                // Start after visible part of this day (e.g. event starts at 11PM, END_HOUR is 22 (10PM))
                // This needs to be END_HOUR for calculation, not display. If END_HOUR is 24, then 23:xx is fine.
                // if (eventLocalStartHour >= END_HOUR && eventStartObj.getDate() === currentDate.getDate()) return false;


                return true; // Basic day overlap is enough, positioning will handle the rest
              })
              .map(event => {
                let eventStartObj: Date | null = null;
                let eventEndObj: Date | null = null;
                let isAllDay = false;

                if (event.start.dateTime) {
                  eventStartObj = new Date(event.start.dateTime);
                  eventEndObj = event.end.dateTime ? new Date(event.end.dateTime) : new Date(eventStartObj.getTime() + 60 * MINUTES_IN_HOUR * 1000);
                } else if (event.start.date) {
                  isAllDay = true;
                  eventStartObj = new Date(event.start.date + 'T00:00:00Z'); // Treat as UTC start of day
                  eventEndObj = event.end.date ? new Date(event.end.date + 'T00:00:00Z') : new Date(eventStartObj.getTime() + 24 * 60 * MINUTES_IN_HOUR * 1000);
                  if(event.end.date === event.start.date) eventEndObj.setDate(eventEndObj.getDate() + 1); // Exclusive end for all-day
                }
                
                if (!eventStartObj || !eventEndObj) return null;

                // Skip rendering if event is completely outside the visible hours for this specific day
                const currentDayVisibleStartTimestamp = new Date(currentDate).setHours(START_HOUR,0,0,0);
                const currentDayVisibleEndTimestamp = new Date(currentDate).setHours(END_HOUR,0,0,0);


                if (eventStartObj.getDate() === currentDate.getDate() && eventStartObj.getHours() >= END_HOUR) return null;
                if (eventEndObj.getDate() === currentDate.getDate() && eventEndObj.getHours() < START_HOUR && eventEndObj.getMinutes() === 0) return null;
                // If event ends before or at the start of visible hours AND starts before visible hours for the current day
                if (eventEndObj.getTime() <= currentDayVisibleStartTimestamp && eventStartObj.getTime() < currentDayVisibleStartTimestamp ) return null;


                let startHourForCalc = eventStartObj.getHours();
                let startMinutesForCalc = eventStartObj.getMinutes();

                // Adjust if event starts before START_HOUR but spans into visible time on the current day
                if (eventStartObj.getTime() < currentDayVisibleStartTimestamp && eventStartObj.getDate() === currentDate.getDate()) {
                    startHourForCalc = START_HOUR;
                    startMinutesForCalc = 0;
                } else if (eventStartObj < currentDate) { // Starts on a previous day
                    startHourForCalc = START_HOUR;
                    startMinutesForCalc = 0;
                }
                
                const adjustedEventStartHour = startHourForCalc - START_HOUR;
                let topOffsetRem = (adjustedEventStartHour + startMinutesForCalc / MINUTES_IN_HOUR) * HOUR_SLOT_HEIGHT_REM;
                topOffsetRem = Math.max(0, topOffsetRem); // Don't go negative

                let effectiveEventEnd = new Date(eventEndObj.getTime());
                // Cap end time at END_HOUR for duration calculation within the visible part of this day
                if (effectiveEventEnd.getTime() > currentDayVisibleEndTimestamp && effectiveEventEnd.getDate() === currentDate.getDate()) {
                    effectiveEventEnd = new Date(currentDayVisibleEndTimestamp);
                } else if (effectiveEventEnd.getDate() > currentDate.getDate()) { // Spans past current day
                     effectiveEventEnd = new Date(currentDayVisibleEndTimestamp);
                }
                
                let effectiveEventStartForDuration = new Date(eventStartObj.getTime());
                 if (effectiveEventStartForDuration.getTime() < currentDayVisibleStartTimestamp && effectiveEventStartForDuration.getDate() === currentDate.getDate()) {
                    effectiveEventStartForDuration = new Date(currentDayVisibleStartTimestamp);
                } else if (effectiveEventStartForDuration < currentDate) { // Starts on a previous day
                    effectiveEventStartForDuration = new Date(currentDayVisibleStartTimestamp);
                }


                let durationMinutes = (effectiveEventEnd.getTime() - effectiveEventStartForDuration.getTime()) / (1000 * 60);
                durationMinutes = Math.max(0, durationMinutes); // No negative duration

                let heightRem = (durationMinutes / MINUTES_IN_HOUR) * HOUR_SLOT_HEIGHT_REM;
                heightRem = Math.max(heightRem, HOUR_SLOT_HEIGHT_REM / 4); // Min height (e.g., 15 mins)
                if (heightRem <=0) return null; // Don't render if no visible duration

                const displayTime = isAllDay ? "All day" : eventStartObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });

                if (isAllDay) {
                  return (
                    <div key={event.id + "-allday"} className="bg-green-100 p-1 rounded text-xs break-words mb-1 text-center sticky top-0 z-20"> {/* Sticky all-day events */}
                      {event.summary}
                    </div>
                  );
                }
                
                // Final check to ensure it's within the visible day part
                if (startHourForCalc >= END_HOUR || (eventStartObj.getHours() + durationMinutes/MINUTES_IN_HOUR) <= START_HOUR) {
                    if(eventStartObj.getDate() === currentDate.getDate()) return null; // if it's on the same day but completely out of view
                }


                return (
                  <div
                    key={event.id}
                    className="absolute w-[calc(100%-0.5rem)] left-[0.25rem] right-[0.25rem] bg-blue-500 text-white p-1.5 rounded text-xs break-words shadow-md overflow-hidden"
                    style={{
                      top: `${topOffsetRem}rem`,
                      height: `${heightRem}rem`,
                      zIndex: 20,
                    }}
                  >
                    <p className="font-semibold truncate">{event.summary}</p>
                    <p className="text-xs">{displayTime}</p>
                  </div>
                );
              })}
          </div>
        </div>
      );
    });

    return (
      <div className="flex border border-gray-200 rounded-lg bg-white overflow-x-auto">
        <div className="p-2 border-r border-gray-200 sticky left-0 bg-white z-10">
          {/* Time slots - adjust to start from START_HOUR */}
          {Array.from({ length: VISIBLE_HOURS }, (_, i) => {
            const hour = START_HOUR + i;
            let displayHour: string;
            if (hour === 0 || hour === 24) displayHour = '12 AM';
            else if (hour < 12) displayHour = `${hour} AM`;
            else if (hour === 12) displayHour = '12 PM';
            else displayHour = `${hour - 12} PM`;
            return (
              <div key={hour} className="h-12 text-xs text-gray-500 flex items-center justify-end pr-1">
                {displayHour}
              </div>
            );
          })}
        </div>
        <div className={`flex flex-grow`}>
          {dayColumns}
        </div>
      </div>
    );
  };


  return (
    <div className="space-y-6">
      <Collapsible open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-3">
            <div>
              <CardTitle>Google Calendar Integration</CardTitle>
              <CardDescription>
                Select calendars and view options. Ensure you are connected in Settings.
              </CardDescription>
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-9 p-0">
                {isSettingsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                <span className="sr-only">Toggle Calendar Settings</span>
              </Button>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-4 pt-4">
              {error && <p className="text-red-500">{error}</p>}
              {!isGoogleApiReady && <p>Initializing Google Calendar API...</p>}
              {isGoogleApiReady && (
                <div className="flex flex-wrap gap-4 items-start">
                  <div>
                    <Label className="mb-2 block">Select Calendars:</Label>
                    {isLoading && calendars.length === 0 && <p>Loading calendars...</p>}
                    {!isLoading && calendars.length === 0 && isGoogleApiReady && <p>No calendars found or unable to load. Check Google connection.</p>}
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                      {calendars.map(cal => (
                        <div key={cal.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`cal-${cal.id}`}
                            checked={selectedCalendars.includes(cal.id)}
                            onCheckedChange={() => handleCalendarSelectionChange(cal.id)}
                            disabled={!cal.id}
                          />
                          <Label htmlFor={`cal-${cal.id}`}>{cal.summary}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="viewType" className="mb-2 block">View Type:</Label>
                    <Select value={viewType} onValueChange={(value: 'week' | '4day') => setViewType(value)} disabled={!isGoogleApiReady || isLoading}>
                      <SelectTrigger id="viewType" className="w-[180px]">
                        <SelectValue placeholder="Select view" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="week">Week View (7 days)</SelectItem>
                        <SelectItem value="4day">4-Day View</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAddEvent} disabled={!isGoogleApiReady || isLoading || isLoadingEvents || selectedCalendars.length === 0}>Add Event</Button>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {isGoogleApiReady && (
        <Card>
          <CardHeader>
            <CardTitle>{viewType === 'week' ? 'Weekly View' : '4-Day View'}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingEvents && <p>Loading events...</p>}
            {!isLoadingEvents && events.length === 0 && selectedCalendars.length > 0 && <p>No events to display for the selected calendars and view period.</p>}
            {!isLoadingEvents && selectedCalendars.length === 0 && <p>Please select at least one calendar to display events.</p>}
            {!isLoadingEvents && events.length > 0 && renderCalendarGrid()}
          </CardContent>
        </Card>
      )}
    </div>
  );
}