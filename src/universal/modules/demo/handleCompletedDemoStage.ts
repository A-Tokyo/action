import mapGroupsToStages from 'universal/utils/makeGroupsToStages'
import shortid from 'shortid'
import {DISCUSS, GROUP, REFLECT, VOTE} from 'universal/utils/constants'
import extractTextFromDraftString from 'universal/utils/draftjs/extractTextFromDraftString'
import makeDiscussionStage from 'universal/utils/makeDiscussionStage'
import {demoMeetingId} from './initDB'

const removeEmptyReflections = (db) => {
  const reflections = db.reflections.filter((reflection) => reflection.isActive)
  const emptyReflectionGroupIds: string[] = []
  const emptyReflectionIds: string[] = []
  reflections.forEach((reflection) => {
    const text = extractTextFromDraftString(reflection.content)
    if (text.length === 0) {
      emptyReflectionGroupIds.push(reflection.reflectionGroupId)
      emptyReflectionIds.push(reflection.id)
    }
  })
  if (emptyReflectionGroupIds.length > 0) {
    db.reflections
      .filter((reflection) => emptyReflectionIds.includes(reflection.id))
      .forEach((reflection) => {
        reflection.isActive = false
      })
    db.reflectionGroups
      .filter((reflectionGroup) => emptyReflectionGroupIds.includes(reflectionGroup.id))
      .forEach((reflectionGroup) => {
        reflectionGroup.isActive = false
      })
  }
  return {emptyReflectionGroupIds}
}

const entityLookup = {
  refx: {
    entities: [
      {
        lemma: 'foo',
        name: 'Foo',
        salience: 1
      }
    ],
    title: 'Foo'
    // smartTitle: 'Foo'
  }
}

const addEntitiesToReflections = (db) => {
  db.reflections.forEach((reflection) => {
    const entities = entityLookup[reflection.id]
    if (entities) {
      reflection.entities = entities
    } else {
      // TODO what do for the user ones?
    }
  })
}

const addDefaultGroupTitles = (db) => {
  const reflectionGroupIds = db.reflectionGroups
    .filter((group) => group.reflections.length === 1)
    .map((group) => {
      const [reflection] = group.reflections
      const title =
        entityLookup[reflection.id] || extractTextFromDraftString(reflection.content).slice(0, 20)
      group.title = title
      group.smartTitle = title
      return group.id
    })
  return {meetingId: demoMeetingId, reflectionGroupIds}
}

const addDiscussionTopics = (db) => {
  const meeting = db.newMeeting
  const {id: meetingId, phases} = meeting
  const discussPhase = phases.find((phase) => phase.phaseType === DISCUSS)
  if (!discussPhase) return {}
  const placeholderStage = discussPhase.stages[0]

  const importantReflectionGroups = mapGroupsToStages(db.reflectionGroups)
  const nextDiscussStages = importantReflectionGroups.map((reflectionGroup, idx) => {
    const id = idx === 0 ? placeholderStage.id : shortid.generate()
    return makeDiscussionStage(reflectionGroup.id, meetingId, idx, id)
  })
  const firstDiscussStage = nextDiscussStages[0]
  if (!firstDiscussStage || !placeholderStage) return {}
  discussPhase.stages = nextDiscussStages
  return {meetingId, discussPhaseStages: nextDiscussStages}
}

const handleCompletedDemoStage = (db, stage) => {
  if (stage.phaseType === REFLECT) {
    const data = removeEmptyReflections(db)
    addEntitiesToReflections(db)
    return {[REFLECT]: data, [GROUP]: null, [VOTE]: null}
  } else if (stage.phaseType === GROUP) {
    const data = addDefaultGroupTitles(db)
    return {[REFLECT]: null, [GROUP]: data, [VOTE]: null}
  } else if (stage.phaseType === VOTE) {
    const data = addDiscussionTopics(db)
    return {[REFLECT]: null, [GROUP]: null, [VOTE]: data}
  }
  return {}
}

export default handleCompletedDemoStage