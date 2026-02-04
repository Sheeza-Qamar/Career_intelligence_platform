import React, {useContext} from 'react';
import { Droppable } from "react-beautiful-dnd";
import {ResumeContext} from "../../../../builder";
import WorkExperience from "../components/WorkExperience";

const WorkExperiences = () => {
  const {resumeData} = useContext(ResumeContext);

  return (
    <Droppable droppableId="work-experience" type="WORK_EXPERIENCE">
      {(provided) => (
        <div {...provided.droppableProps} ref={provided.innerRef}>
          <h2
            className="section-title mb-1 border-b-2 border-gray-300 editable"
            contentEditable
            suppressContentEditableWarning
          >
            Work Experience
          </h2>
          {resumeData.workExperience.map((item, index) => (
            <WorkExperience
              key={index}
              item={item}
              index={index}
            />
          ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
};

export default WorkExperiences;
