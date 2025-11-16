      <Dialog open={showAppointmentDetailDialog} onOpenChange={(open) => {
        setShowAppointmentDetailDialog(open);
        if (!open) {
          setIsEditingAppointment(false);
          setSelectedAppointment(null);
        }
      }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditingAppointment ? "Edit Appointment" : "Appointment Details"}</DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              {!isEditingAppointment ? (
                // View Mode
                <>
                  <div>
                    <Label className="text-muted-foreground">Service</Label>
                    <p className="text-lg font-semibold">{selectedAppointment.serviceName || selectedAppointment.title}</p>
                  </div>

                  {selectedAppointment.clientName && (
                    <div>
                      <Label className="text-muted-foreground">Client</Label>
                      <p className="font-medium">{selectedAppointment.clientName}</p>
                      {selectedAppointment.clientEmail && (
                        <p className="text-sm text-muted-foreground">{selectedAppointment.clientEmail}</p>
                      )}
                    </div>
                  )}

                  {selectedAppointment.description && (
                    <div>
                      <Label className="text-muted-foreground">Description</Label>
                      <p>{selectedAppointment.description}</p>
                    </div>
                  )}

                  <div>
                    <Label className="text-muted-foreground">Date & Time</Label>
                    <p className="font-medium">
                      {new Date(selectedAppointment.startTime).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedAppointment.startTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      -{" "}
                      {new Date(selectedAppointment.endTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  {selectedAppointment.price && (
                    <div>
                      <Label className="text-muted-foreground">Price</Label>
                      <p className="text-lg font-semibold text-primary">${selectedAppointment.price}</p>
                    </div>
                  )}

                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <p className="capitalize">{selectedAppointment.status}</p>
                  </div>

                  <div className="flex gap-2 pt-4">
                    {isArtist && (
                      <Button
                        variant="default"
                        onClick={() => setIsEditingAppointment(true)}
                        className="flex-1"
                      >
                        Edit
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this appointment?')) {
                          deleteAppointmentMutation.mutate(selectedAppointment.id);
                        }
                      }}
                      disabled={deleteAppointmentMutation.isPending}
                      className="flex-1"
                    >
                      {deleteAppointmentMutation.isPending ? "Deleting..." : "Delete"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowAppointmentDetailDialog(false);
                        setSelectedAppointment(null);
                        setIsEditingAppointment(false);
                      }}
                      className="flex-1"
                    >
                      Close
                    </Button>
                  </div>
                </>
              ) : (
                // Edit Mode
                <>
                  <div className="space-y-2">
                    <Label htmlFor="edit-client">Client *</Label>
                    <Select
                      value={selectedAppointment.clientId?.toString()}
                      onValueChange={(value) => setSelectedAppointment({...selectedAppointment, clientId: parseInt(value)})}
                    >
                      <SelectTrigger id="edit-client">
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client: any) => (
                          <SelectItem key={client.id} value={client.id.toString()}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-title">Title *</Label>
                    <Input
                      id="edit-title"
                      value={selectedAppointment.title || selectedAppointment.serviceName || ""}
                      onChange={(e) => setSelectedAppointment({...selectedAppointment, title: e.target.value})}
                      placeholder="e.g., Tattoo Session"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                      id="edit-description"
                      value={selectedAppointment.description || ""}
                      onChange={(e) => setSelectedAppointment({...selectedAppointment, description: e.target.value})}
                      placeholder="Additional details..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-start-time">Start Time *</Label>
                      <Input
                        id="edit-start-time"
                        type="datetime-local"
                        value={new Date(selectedAppointment.startTime).toISOString().slice(0, 16)}
                        onChange={(e) => setSelectedAppointment({...selectedAppointment, startTime: new Date(e.target.value).toISOString()})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-end-time">End Time *</Label>
                      <Input
                        id="edit-end-time"
                        type="datetime-local"
                        value={new Date(selectedAppointment.endTime).toISOString().slice(0, 16)}
                        onChange={(e) => setSelectedAppointment({...selectedAppointment, endTime: new Date(e.target.value).toISOString()})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-status">Status</Label>
                    <Select
                      value={selectedAppointment.status}
                      onValueChange={(value) => setSelectedAppointment({...selectedAppointment, status: value})}
                    >
                      <SelectTrigger id="edit-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="default"
                      onClick={() => {
                        updateAppointmentMutation.mutate({
                          id: selectedAppointment.id,
                          clientId: selectedAppointment.clientId,
                          title: selectedAppointment.title || selectedAppointment.serviceName,
                          description: selectedAppointment.description,
                          startTime: new Date(selectedAppointment.startTime),
                          endTime: new Date(selectedAppointment.endTime),
                          status: selectedAppointment.status,
                        });
                      }}
                      disabled={updateAppointmentMutation.isPending}
                      className="flex-1"
                    >
                      {updateAppointmentMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditingAppointment(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
