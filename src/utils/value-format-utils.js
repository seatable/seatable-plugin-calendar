export const getCollaboratorsName = (collaborators, cellVal) => {
  if (cellVal) {
    let collaboratorsName = [];
    cellVal.forEach((v) => {
      let collaborator = collaborators.find(c => c.email === v);
      if (collaborator) {
        collaboratorsName.push(collaborator.name);
      }
    });
    if (collaboratorsName.length === 0) {
      return null;
    }
    return collaboratorsName.join(',');
  }
  return null;
};