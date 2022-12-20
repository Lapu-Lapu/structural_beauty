import numpy as np
import cv2
import mediapipe as mp
mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles
mp_face_mesh = mp.solutions.face_mesh

left_eye = [i[1] for i in mp.solutions.face_mesh.FACEMESH_LEFT_EYE]
right_eye = [i[0] for i in mp.solutions.face_mesh.FACEMESH_RIGHT_EYE]

def draw(image, results):
    annotated_image = image.copy()
    for face_landmarks in results.multi_face_landmarks:
        #print('face_landmarks:', face_landmarks)
        mp_drawing.draw_landmarks(
          image=annotated_image,
          landmark_list=face_landmarks,
          connections=mp_face_mesh.FACEMESH_TESSELATION,
          landmark_drawing_spec=None,
          connection_drawing_spec=mp_drawing_styles
          .get_default_face_mesh_tesselation_style())
        mp_drawing.draw_landmarks(
          image=annotated_image,
          landmark_list=face_landmarks,
          connections=mp_face_mesh.FACEMESH_CONTOURS,
          landmark_drawing_spec=None,
          connection_drawing_spec=mp_drawing_styles
          .get_default_face_mesh_contours_style())
        mp_drawing.draw_landmarks(
          image=annotated_image,
          landmark_list=face_landmarks,
          connections=mp_face_mesh.FACEMESH_IRISES,
          landmark_drawing_spec=None,
          connection_drawing_spec=mp_drawing_styles
          .get_default_face_mesh_iris_connections_style())
    return annotated_image


def compute_w_ratio(results):
    p_lefteye, p_righteye, p_left, p_right = get_points(results)
    return np.linalg.norm(p_lefteye - p_righteye) / np.linalg.norm(p_left - p_right)

def get_points(results):
    landmarks = results.multi_face_landmarks[0]
    p_lefteye = mean([landmarks.landmark[i] for i in left_eye])
    p_righteye = mean([landmarks.landmark[i] for i in right_eye])
    p_left = to_array(landmarks.landmark[356])
    p_right = to_array(landmarks.landmark[127])
    return p_lefteye, p_righteye, p_left, p_right

def to_array(p):
    return np.array([p.x, p.y, p.z])

def mean(points):
    return np.mean(np.array([to_array(p) for p in points]), axis=0)